async function loadForm() {
    console.log("--- Инициализация формы ---");
    
    const container = document.getElementById('form-container');
    if (!container) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА: Элемент #form-container не найден в HTML!");
        return;
    }

    try {
        console.log("Запрос данных от /api/get_fields...");
        const response = await fetch('/api/get_fields');
        
        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        const data = await response.json();
        console.log("Данные получены успешно:", data);

        if (data.status !== 'success' || !data.fields) {
            container.innerHTML = `<p style="color:orange">Бэкенд не вернул поля. Статус: ${data.status}</p>`;
            return;
        }

        // Очищаем контейнер перед отрисовкой
        container.innerHTML = '';

        const fieldsEntries = Object.entries(data.fields);
        if (fieldsEntries.length === 0) {
            container.innerHTML = '<p>Список полей пуст. Проверь ALLOWED_FIELDS в Python.</p>';
            return;
        }

        // Рисуем поля
        fieldsEntries.forEach(([id, info]) => {
            console.log(`Отрисовка поля: ${id}`);
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = "15px";

            const label = document.createElement('label');
            label.innerHTML = `<b>${info.title || id}</b>`;
            label.style.display = "block";
            wrapper.appendChild(label);

            let input;
            if (info.type === 'enumeration') {
                input = document.createElement('select');
                info.items.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item.ID;
                    opt.textContent = item.VALUE;
                    input.appendChild(opt);
                });
            } else {
                input = document.createElement('input');
                input.type = info.type === 'file' ? 'file' : 'text';
            }

            input.name = id;
            input.style.width = "100%";
            input.style.padding = "8px";
            
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        });

        console.log("--- Отрисовка завершена ---");

    } catch (err) {
        console.error("ПРОИЗОШЛА ОШИБКА:", err);
        container.innerHTML = `<p style="color:red">Ошибка: ${err.message}</p>`;
    }
}

// Запускаем функцию
loadForm();

// 1. Помощник для перевода файла в строку (Base64), которую понимает Битрикс
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Отрезаем технический заголовок
    reader.onerror = error => reject(error);
});

// 2. Слушатель события отправки формы
document.getElementById('dynamic-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Чтобы страница не перезагружалась
    
    const btn = document.getElementById('submit-btn');
    const originalBtnText = btn.textContent;
    
    // Визуальный отклик
    btn.disabled = true;
    btn.textContent = 'Создаем запись...';

    const formData = new FormData(e.target);
    const fieldsData = {};

    try {
        // Проходим по всем полям и готовим их для API
        for (let [key, value] of formData.entries()) {
            if (value instanceof File && value.name) {
                // Обработка файла
                const base64 = await fileToBase64(value);
                fieldsData[key] = [value.name, base64];
            } else if (value !== "" && value !== undefined) {
                // Обработка обычных строк и списков
                fieldsData[key] = value;
            }
        }

        console.log("Данные к отправке:", fieldsData);

        // Отправляем на наш Python-бэкенд
        const response = await fetch('/api/create_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fieldsData)
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert('Ура! Элемент создан. ID: ' + result.id);
            e.target.reset(); // Очищаем форму
        } else {
            console.error("Ошибка Битрикса:", result.details);
            alert('Битрикс не принял данные. Проверь консоль.');
        }
    } catch (error) {
        console.error("Ошибка сети или скрипта:", error);
        alert('Не удалось отправить форму: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalBtnText;
    }
});