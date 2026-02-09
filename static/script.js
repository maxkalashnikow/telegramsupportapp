let currentBitrixUserId = null;
const urlParams = new URLSearchParams(window.location.search);
const tgNick = urlParams.get('tg');

const tele = window.Telegram.WebApp;
tele.ready(); // Сообщаем Telegram, что приложение готово

// Пытаемся получить ник пользователя из Telegram
const tgUser = tele.initDataUnsafe?.user;
const tgNick = tgUser?.username || tgUser?.id?.toString(); 

async function initApp() {
    console.log("Данные из Telegram:", tgUser);
    
    const regContainer = document.getElementById('registration-container');
    const mainForm = document.getElementById('dynamic-form');

    // Если ник не удалось получить (например, открыли в обычном браузере)
    if (!tgNick) {
        document.getElementById('form-container').innerHTML = 
            "Пожалуйста, откройте это приложение внутри Telegram.";
        return;
    }

    try {
        // Теперь запрос пойдет с настоящим ником из Telegram
        const response = await fetch(`/api/check_user?tg=${tgNick}`);
        const data = await response.json();

        if (data.status === 'found') {
            currentBitrixUserId = data.bitrix_id;
            regContainer.style.display = 'none';
            mainForm.style.display = 'block';
            loadForm();
        } else {
            // Если ника нет в Redis, показываем окно привязки ID Битрикса
            regContainer.style.display = 'block';
            mainForm.style.display = 'none';
        }
    } catch (err) {
        console.error("Ошибка:", err);
    }
}
async function registerUser() {
    const bitrixId = document.getElementById('reg-bitrix-id').value;
    if (!bitrixId) return alert("Введите ID!");

    const response = await fetch('/api/save_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg: tgNick, bitrix_id: bitrixId })
    });

    if (response.ok) {
        alert("Успешно привязано!");
        location.reload();
    }
}
async function loadForm() {
    console.log("--- Загрузка полей из Битрикс ---");
    const container = document.getElementById('form-container');
    
    try {
        const response = await fetch('/api/get_fields');
        const data = await response.json();

        if (data.status === 'success') {
            container.innerHTML = '';
            Object.entries(data.fields).forEach(([id, info]) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'field-group';
                
                const label = document.createElement('label');
                label.innerHTML = `<b>${info.title || id}</b>`;
                wrapper.appendChild(label);

                let input;
                if (info.type === 'file') {
                    // Твоя красивая кнопка файла
                    const fileWrapper = document.createElement('div');
                    fileWrapper.className = 'file-input-wrapper';
                    input = document.createElement('input');
                    input.type = 'file';
                    input.id = 'file_' + id;
                    input.className = 'file-input';
                    
                    const fLabel = document.createElement('label');
                    fLabel.htmlFor = 'file_' + id;
                    fLabel.className = 'file-label';
                    fLabel.textContent = 'Выберите файл';
                    
                    fileWrapper.appendChild(input);
                    fileWrapper.appendChild(fLabel);
                    wrapper.appendChild(fileWrapper);
                } else {
                    input = document.createElement('input');
                    input.type = info.type === 'number' ? 'number' : 'text';
                    wrapper.appendChild(input);
                }
                input.name = id;
                container.appendChild(wrapper);
            });
        }
    } catch (e) {
        console.error("Ошибка loadForm:", e);
    }
}



// ВАЖНО: Запускаем процесс
document.addEventListener('DOMContentLoaded', initApp);
