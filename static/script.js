async function loadForm() {
    console.log("--- Инициализация формы ---");
    
    const container = document.getElementById('form-container');
    if (!container) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА: Элемент #form-container не найден в HTML!");
        return;
    }

    fieldsEntries.forEach(([id, info]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'field-group fade-in';

    const label = document.createElement('label');
    label.innerHTML = `<b>${info.title || id}</b>`;
    wrapper.appendChild(label);

    let input; // Объявляем переменную здесь, чтобы она была доступна везде ниже

    if (info.type === 'enumeration') {
        input = document.createElement('select');
        info.items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.ID;
            opt.textContent = item.VALUE;
            input.appendChild(opt);
        });
        wrapper.appendChild(input); // Сразу добавляем в wrapper
    } 
    else if (info.type === 'file') {
        const fileWrapper = document.createElement('div');
        fileWrapper.style.display = 'flex';
        fileWrapper.style.alignItems = 'center';

        input = document.createElement('input'); // Инициализируем наш input
        input.type = 'file';
        input.id = 'file_' + id;
        input.className = 'file-input';

        const fileLabel = document.createElement('label'); // Переименовал в fileLabel, чтобы не путать с основным
        fileLabel.htmlFor = 'file_' + id;
        fileLabel.className = 'file-label';
        fileLabel.textContent = 'Выберите файл';

        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'file-name-display';
        fileNameSpan.textContent = 'Файл не выбран';

        input.addEventListener('change', (e) => {
            const fileName = e.target.files[0] ? e.target.files[0].name : 'Файл не выбран';
            fileNameSpan.textContent = fileName;
        });

        fileWrapper.appendChild(input);
        fileWrapper.appendChild(fileLabel);
        fileWrapper.appendChild(fileNameSpan);
        wrapper.appendChild(fileWrapper);
    } 
    else {
        input = document.createElement('input');
        input.type = info.type === 'number' ? 'number' : 'text';
        wrapper.appendChild(input);
    }

    // Теперь эта строка сработает для всех типов, так как input везде определен
    input.name = id; 
    input.style.width = "100%"; 
    // Для файла ширину лучше не форсировать, если он скрыт, но для порядка оставим
    
    container.appendChild(wrapper);
});

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