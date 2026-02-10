// 1. Инициализация Telegram
const tele = window.Telegram.WebApp;
if (tele) {
    tele.ready();
    tele.expand();
}

// 2. Данные пользователя
const tgUser = tele?.initDataUnsafe?.user;
const tgNick = tgUser?.username || tgUser?.id?.toString(); 
let currentBitrixUserId = null;

// 3. Главная функция проверки
async function initApp() {
    console.log("--- Запуск InitApp ---");
    
    // Ищем элементы один раз
    const regWin = document.getElementById('registration-container');
    const mainForm = document.getElementById('dynamic-form');
    const formContainer = document.getElementById('form-container');

    // Если мы не в Telegram (для тестов в браузере)
    if (!tgNick) {
        console.warn("Ник не найден. Проверьте, что открыто в TG.");
        if (formContainer) {
            formContainer.innerHTML = "<div class='error'>Пожалуйста, откройте приложение через Telegram.</div>";
        }
        return;
    }

    try {
        const response = await fetch(`/api/check_user?tg=${tgNick}`);
        if (!response.ok) throw new Error('Ошибка сети');
        
        const data = await response.json();
        console.log("Данные от API:", data);

        if (data.status === 'found') {
            currentBitrixUserId = data.bitrix_id;
            if (regWin) regWin.style.setProperty('display', 'none', 'important');
            if (mainForm) mainForm.style.setProperty('display', 'block', 'important');
            await loadForm();
        } else {
            if (regWin) regWin.style.setProperty('display', 'block', 'important');
            if (mainForm) mainForm.style.setProperty('display', 'none', 'important');
        }
    } catch (err) {
        console.error("Критическая ошибка initApp:", err);
    }
}

// 4. Отрисовка полей (Твоя логика списков и дизайна)
async function loadForm() {
    console.log("--- Загрузка полей ---");
    const container = document.getElementById('form-container');
    if (!container) return;

    try {
        const response = await fetch('/api/get_fields');
        const data = await response.json();

        if (data.status === 'success' && data.fields) {
            container.innerHTML = '';
            
            Object.entries(data.fields).forEach(([id, info]) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'field-group';

                const label = document.createElement('label');
                label.innerHTML = `<b>${info.title || id}</b>`;
                wrapper.appendChild(label);

                // СПИСКИ
                if (info.type === 'enumeration' && info.items) {
                    const select = document.createElement('select');
                    select.name = id;
                    select.className = 'form-select'; // Добавь класс для CSS
                    info.items.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.ID;
                        opt.textContent = item.VALUE;
                        select.appendChild(opt);
                    });
                    wrapper.appendChild(select);
                } 
                // ФАЙЛЫ
                else if (info.type === 'file') {
                    const fileWrapper = document.createElement('div');
                    fileWrapper.className = 'file-input-wrapper';

                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.id = 'file_' + id;
                    fileInput.name = id;
                    fileInput.className = 'file-input';

                    const fileLabel = document.createElement('label');
                    fileLabel.htmlFor = 'file_' + id;
                    fileLabel.className = 'file-label';
                    fileLabel.textContent = 'Выберите файл';

                    fileInput.addEventListener('change', (e) => {
                        fileLabel.textContent = e.target.files[0]?.name || 'Выберите файл';
                    });

                    fileWrapper.appendChild(fileInput);
                    fileWrapper.appendChild(fileLabel);
                    wrapper.appendChild(fileWrapper);
                } 
                // ТЕКСТ / ЧИСЛА
                else {
                    const input = document.createElement('input');
                    input.name = id;
                    input.type = (info.type === 'number') ? 'number' : 'text';
                    wrapper.appendChild(input);
                }

                container.appendChild(wrapper);
            });
        }
    } catch (e) {
        console.error("Ошибка отрисовки формы:", e);
        container.innerHTML = "Ошибка загрузки полей.";
    }
}

// 5. Регистрация
async function registerUser() {
    const input = document.getElementById('reg-bitrix-id');
    const bitrixId = input?.value;
    if (!bitrixId) return alert("Введите ID!");

    try {
        const response = await fetch('/api/save_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tg: tgNick, bitrix_id: bitrixId })
        });
        if (response.ok) {
            location.reload();
        } else {
            alert("Ошибка при сохранении.");
        }
    } catch (e) {
        console.error("Ошибка регистрации:", e);
    }
}

// 6. ЗАПУСК
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}