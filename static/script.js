// 1. Конфигурация всех ID (меняй здесь, и всё обновится само)
const CONFIG = {
    ids: {
        regContainer: 'registration-container',
        mainForm: 'dynamic-form',
        formFieldsContainer: 'form-container',
        regInput: 'reg-bitrix-id', // Тот самый ID
        regButton: 'reg-btn',
        deleteButton: 'btn-delete-me'
    },
    api: {
        checkUser: '/api/check_user',
        saveUser: '/api/save_user',
        getFields: '/api/get_fields',
        createTicket: '/api/create_ticket',
        deleteUser: '/api/delete_user'
    }
};

const tele = window.Telegram.WebApp;
const tgUser = tele?.initDataUnsafe?.user;
const tgNick = tgUser?.username || tgUser?.id?.toString();

// 2. Главный контроллер
async function initApp() {
    tele.ready();
    tele.expand();

    if (!tgNick) {
        showError("Пожалуйста, откройте бота в Telegram");
        return;
    }

    try {
        const response = await fetch(`${CONFIG.api.checkUser}?tg=${tgNick}`);
        const data = await response.json();

        if (data.status === 'found') {
            toggleView('form');
            await loadDynamicForm();
        } else {
            toggleView('reg');
        }
    } catch (err) {
        console.error("Init error:", err);
    }
}

// 3. Управление видимостью (через классы или style)
function toggleView(view) {
    const regWin = document.getElementById(CONFIG.ids.regContainer);
    const mainForm = document.getElementById(CONFIG.ids.mainForm);

    if (view === 'form') {
        regWin.style.display = 'none';
        mainForm.style.display = 'block';
    } else {
        regWin.style.display = 'block';
        mainForm.style.display = 'none';
    }
}

// 4. Логика Регистрации
async function handleRegistration() {
    const input = document.getElementById(CONFIG.ids.regInput);
    const bitrixId = input?.value.trim();

    if (!bitrixId) return alert("Введите ваш Bitrix ID");

    const response = await fetch(CONFIG.api.saveUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg: tgNick, bitrix_id: bitrixId })
    });

    if (response.ok) {
        location.reload();
    } else {
        alert("Ошибка сохранения");
    }
}

// 5. Логика Удаления
async function handleDeleteAccount() {
    if (!confirm("Удалить ваш ID из базы?")) return;

    const response = await fetch(CONFIG.api.deleteUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg: tgNick })
    });

    if (response.ok) {
        alert("Данные удалены");
        location.reload();
    }
}

// 6. Навешивание событий (Event Listeners)
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Слушатель на кнопку регистрации
    document.getElementById(CONFIG.ids.regButton)?.addEventListener('click', handleRegistration);

    // Слушатель на кнопку удаления
    document.getElementById(CONFIG.ids.deleteButton)?.addEventListener('click', handleDeleteAccount);

    // Слушатель на отправку формы
    document.getElementById(CONFIG.ids.mainForm)?.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Твоя логика создания заявки (crm.item.add)
    });
});

function showError(msg) {
    const container = document.getElementById(CONFIG.ids.formFieldsContainer);
    if (container) container.innerHTML = `<div class="error">${msg}</div>`;
}