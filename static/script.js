async function loadForm() {
    try {
        const response = await fetch('/api/get_fields');
        const data = await response.json();

        if (data.status !== 'success') throw new Error('Ошибка загрузки');

        const container = document.getElementById('form-container');
        container.innerHTML = ''; // Очищаем текст загрузки

        const fields = data.fields;

        for (const [id, info] of Object.entries(fields)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'field-group';

            // Создаем заголовок (Label)
            const label = document.createElement('label');
            label.textContent = info.title;
            if (info.isRequired) label.className = 'required';
            wrapper.appendChild(label);

            let input;

            // Логика выбора типа элемента
            if (info.type === 'enumeration') {
                // Если это список - создаем select
                input = document.createElement('select');
                input.name = id;
                
                // Добавляем пустой вариант
                const defaultOpt = document.createElement('option');
                defaultOpt.value = "";
                defaultOpt.textContent = "-- Выберите --";
                input.appendChild(defaultOpt);

                // Добавляем варианты из Битрикса
                info.items.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item.ID;
                    opt.textContent = item.VALUE;
                    input.appendChild(opt);
                });
            } 
            else if (info.type === 'file') {
                // Если это файл
                input = document.createElement('input');
                input.type = 'file';
                input.name = id;
            } 
            else {
                // По умолчанию - обычное текстовое поле
                input = document.createElement('input');
                input.type = 'text';
                input.name = id;
                input.placeholder = `Введите ${info.title.toLowerCase()}`;
            }

            if (info.isRequired) input.required = true;
            
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        }
    } catch (error) {
        console.error(error);
        document.getElementById('form-container').innerHTML = '<p style="color:red">Ошибка загрузки полей</p>';
    }
}

// Запускаем при загрузке страницы
loadForm();