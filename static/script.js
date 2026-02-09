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