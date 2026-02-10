// Инициализация Telegram
const tele = window.Telegram.WebApp;
tele.ready();

// ПОЛУЧАЕМ НИК (ТОЛЬКО ОДНО ОБЪЯВЛЕНИЕ)
const tgUser = tele.initDataUnsafe?.user;
const tgNick = tgUser?.username || tgUser?.id?.toString(); 

async function initApp() {
    console.log("--- Приложение запущено для:", tgNick);
    const regWin = document.getElementById('registration-container');
    const mainForm = document.getElementById('dynamic-form');

    if (!tgNick) {
        console.error("Ник не найден");
        return;
    }

    try {
        const response = await fetch(`/api/check_user?tg=${tgNick}`);
        const data = await response.json();

        if (data.status === 'found') {
            if (regWin) regWin.style.display = 'none';
            if (mainForm) mainForm.style.display = 'block';
            loadForm(); // Загружаем твои поля
        } else {
            if (regWin) regWin.style.display = 'block';
            if (mainForm) mainForm.style.display = 'none';
        }
    } catch (err) {
        console.error("Ошибка инициализации:", err);
    }
}

async function loadForm() {
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
                if (info.type === 'enumeration' && info.items) {
                    input = document.createElement('select');
                    info.items.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.ID;
                        opt.textContent = item.VALUE;
                        input.appendChild(opt);
                    });
                } else if (info.type === 'file') {
                    // ТВОЙ ДИЗАЙН ФАЙЛА
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
                    input.type = 'text';
                }

                if (input) {
                    input.name = id;
                    if (info.type !== 'file') wrapper.appendChild(input);
                }
                container.appendChild(wrapper);
            });
        }
    } catch (e) {
        console.error("Ошибка загрузки полей:", e);
    }
}

// ЗАПУСК (ОБЯЗАТЕЛЬНО!)
document.addEventListener('DOMContentLoaded', initApp);