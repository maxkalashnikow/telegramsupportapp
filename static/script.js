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

async function loadDynamicForm() {
    console.log("--- Загрузка полей ---");
    const container = document.getElementById(CONFIG.ids.formFieldsContainer);
    if (!container) return;

    try {
        const response = await fetch(CONFIG.api.getFields);
        const data = await response.json();

        if (data.status === 'success' && data.fields) {
            container.innerHTML = ''; // Очищаем контейнер перед отрисовкой
            
            Object.entries(data.fields).forEach(([id, info]) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'field-group';

                const label = document.createElement('label');
                label.innerHTML = `<b>${info.title || id}</b>`;
                wrapper.appendChild(label);

                // Отрисовка по типу поля
                if (info.type === 'enumeration') {
                    const select = document.createElement('select');
                    select.name = id;
                    select.className = 'form-select';
                    info.items.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.ID;
                        opt.textContent = item.VALUE;
                        select.appendChild(opt);
                    });
                    wrapper.appendChild(select);
                } else if (info.type === 'file') {
                    // Твоя логика для файлов
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.name = id;
                    wrapper.appendChild(input);
                } else {
                    const input = document.createElement('input');
                    input.name = id;
                    input.type = (info.type === 'number') ? 'number' : 'text';
                    wrapper.appendChild(input);
                }

                container.appendChild(wrapper);
            });
        } else {
            container.innerHTML = "Ошибка: Битрикс не вернул поля.";
        }
    } catch (e) {
        console.error("Ошибка отрисовки:", e);
        container.innerHTML = "Критическая ошибка при загрузке формы.";
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