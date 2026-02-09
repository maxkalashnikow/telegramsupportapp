// 1. Глобальные переменные и параметры URL
let currentBitrixUserId = null;
const urlParams = new URLSearchParams(window.location.search);
const tgNick = urlParams.get('tg');

// 2. Функция инициализации (Проверка пользователя в Redis)
async function initApp() {
    const regContainer = document.getElementById('registration-container');
    const dynamicForm = document.getElementById('dynamic-form');
    const formContainer = document.getElementById('form-container');

    if (!tgNick) {
        formContainer.innerHTML = '<div style="color: #721c24; background: #f8d7da; padding: 15px; border-radius: 8px;">' +
                                  '<b>Ошибка:</b> Пожалуйста, откройте форму через Telegram бота.</div>';
        return;
    }

    try {
        const response = await fetch(`/api/check_user?tg=${tgNick}`);
        const data = await response.json();

        if (data.status === 'found') {
            currentBitrixUserId = data.bitrix_id;
            // Прячем загрузку, показываем форму и загружаем поля из Битрикс
            if (regContainer) regContainer.style.display = 'none';
            if (dynamicForm) dynamicForm.style.display = 'block';
            loadForm(); // Вызываем отрисовку полей
        } else {
            // Показываем окно регистрации
            if (regContainer) regContainer.style.display = 'block';
            if (dynamicForm) dynamicForm.style.display = 'none';
        }
    } catch (err) {
        console.error("Ошибка инициализации:", err);
    }
}

// 3. Функция сохранения нового пользователя в базу
async function registerUser() {
    const bitrixIdInput = document.getElementById('reg-bitrix-id');
    const bitrixId = bitrixIdInput ? bitrixIdInput.value : null;
    
    if (!bitrixId) return alert("Введите ваш ID из Битрикс24!");

    const btn = document.getElementById('reg-btn');
    btn.disabled = true;
    btn.textContent = 'Сохраняем...';

    try {
        const response = await fetch('/api/save_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tg: tgNick, bitrix_id: bitrixId })
        });

        if (response.ok) {
            alert("Аккаунт успешно привязан!");
            location.reload(); // Перезагрузка, чтобы сработал initApp и открылась форма
        }
    } catch (err) {
        alert("Ошибка при сохранении");
    } finally {
        btn.disabled = false;
    }
}

// 4. Твоя основная функция загрузки полей
async function loadForm() {
    // ... (весь код loadForm, который мы писали ранее)
}

// 5. Вспомогательные функции (fileToBase64) и обработчик submit
// ... (остальной код)

// 6. САМЫЙ НИЗ ФАЙЛА: Запуск процесса
initApp();
async function loadForm() {
    console.log("--- Инициализация формы ---");
    
    const container = document.getElementById('form-container');
    if (!container) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА: Элемент #form-container не найден в HTML!");
        return;
    }

    try {
        // !!! ВОТ ЭТОГО НЕ ХВАТАЛО: Запрос к серверу за полями
        const response = await fetch('/api/get_fields');
        const data = await response.json();

        if (data.status !== 'success' || !data.fields) {
            container.innerHTML = '<p>Не удалось загрузить поля.</p>';
            return;
        }

        const fieldsEntries = Object.entries(data.fields);
        container.innerHTML = ''; // Очищаем текст "Загрузка..."

        fieldsEntries.forEach(([id, info]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'field-group fade-in';

            const label = document.createElement('label');
            label.innerHTML = `<b>${info.title || id}</b>`;
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
                wrapper.appendChild(input);
            } 
            else if (info.type === 'file') {
                const fileWrapper = document.createElement('div');
                fileWrapper.style.display = 'flex';
                fileWrapper.style.alignItems = 'center';

                input = document.createElement('input'); 
                input.type = 'file';
                input.id = 'file_' + id;
                input.className = 'file-input';

                const fileLabel = document.createElement('label'); 
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

            input.name = id; 
            if (info.type !== 'file') input.style.width = "100%"; 
            
            container.appendChild(wrapper);
        });

    } catch (err) {
        console.error("Ошибка загрузки:", err);
        container.innerHTML = '<p>Ошибка соединения с сервером.</p>';
    }
} // <--- Теперь функция loadForm закрывается здесь правильно

// Запускаем
loadForm();

// Помощник Base64 и обработчик Submit оставляем как есть внизу...
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

document.getElementById('dynamic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    if (!btn) return;
    
    const originalBtnText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Создаем запись...';

    const formData = new FormData(e.target);
    const fieldsData = {};

    try {
        for (let [key, value] of formData.entries()) {
            if (value instanceof File && value.name) {
                const base64 = await fileToBase64(value);
                fieldsData[key] = [value.name, base64];
            } else if (value !== "" && value !== undefined) {
                fieldsData[key] = value;
            }
        }

        const response = await fetch('/api/create_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fieldsData)
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert('Ура! Элемент создан. ID: ' + result.id);
            e.target.reset();
            // Сбрасываем подписи файлов вручную
            document.querySelectorAll('.file-name-display').forEach(el => el.textContent = 'Файл не выбран');
        } else {
            alert('Ошибка: ' + (result.details || 'Неизвестная ошибка'));
        }
    } catch (error) {
        alert('Ошибка отправки: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalBtnText;
    }
});