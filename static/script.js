// Инициализация Telegram WebApp
const tele = window.Telegram.WebApp;
tele.ready();
tele.expand(); // Разворачиваем на весь экран

// Получаем ник пользователя (или ID, если ника нет)
const tgUser = tele.initDataUnsafe?.user;
const tgNick = tgUser?.username || tgUser?.id?.toString(); 

let currentBitrixUserId = null;

// Функция проверки пользователя
async function initApp() {
    console.log("Инициализация. Пользователь:", tgNick);
    const regWin = document.getElementById('registration-container');
    const mainForm = document.getElementById('dynamic-form');

    if (!tgNick) {
        document.getElementById('form-container').innerHTML = "Пожалуйста, откройте в Telegram.";
        return;
    }

    try {
        const response = await fetch(`/api/check_user?tg=${tgNick}`);
        const data = await response.json();

        if (data.status === 'found') {
            currentBitrixUserId = data.bitrix_id;
            if (regWin) regWin.style.display = 'none';
            if (mainForm) mainForm.style.display = 'block';
            await loadForm();
        } else {
            if (regWin) regWin.style.display = 'block';
            if (mainForm) mainForm.style.display = 'none';
        }
    } catch (err) {
        console.error("Ошибка при входе:", err);
    }
}

// Загрузка полей формы
async function loadForm() {
    const container = document.getElementById('form-container');
    try {
        const response = await fetch('/api/get_fields');
        const data = await response.json();

        if (data.status === 'success') {
            container.innerHTML = '';
            Object.entries(data.fields).forEach(([id, info]) => {
                const div = document.createElement('div');
                div.className = 'field-group';
                div.innerHTML = `<label><b>${info.title}</b></label>`;
                
                const input = document.createElement('input');
                input.name = id;
                input.type = (info.type === 'file') ? 'file' : 'text';
                
                div.appendChild(input);
                container.appendChild(div);
            });
        }
    } catch (e) {
        console.error("Ошибка загрузки полей:", e);
    }
}

// Регистрация нового пользователя
async function registerUser() {
    const bitrixId = document.getElementById('reg-bitrix-id').value;
    if (!bitrixId) return alert("Введите ID!");

    try {
        const response = await fetch('/api/save_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tg: tgNick, bitrix_id: bitrixId })
        });

        if (response.ok) {
            alert("Готово! Перезагружаем...");
            location.reload();
        }
    } catch (e) {
        alert("Ошибка сохранения");
    }
}

// ГЛАВНОЕ: Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);