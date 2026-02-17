// Инициализация Telegram
const tele = window.Telegram.WebApp;
tele.ready();

// ПОЛУЧАЕМ НИК (ТОЛЬКО ОДНО ОБЪЯВЛЕНИЕ)
const tgUser = tele.initDataUnsafe?.user;
const tgNick = tgUser?.username || tgUser?.id?.toString(); 

async function initApp() {
    
    //Временный код для отладки без проверки юзера, чтобы не мешало при разработке
    const regWin = document.getElementById('registration-container');
    const mainForm = document.getElementById('dynamic-form');

    // ВРЕМЕННО: Скрываем регистрацию и показываем форму сразу
    if (regWin) regWin.style.display = 'none';
    if (mainForm) mainForm.style.display = 'block';
    
    // Просто загружаем поля без лишних проверок
    loadForm();
    // Код для проверки юзера
    // console.log("--- Приложение запущено для:", tgNick);
    // const regWin = document.getElementById('registration-container');
    // const mainForm = document.getElementById('dynamic-form');

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

document.addEventListener('DOMContentLoaded', () => {
    
    // Кнопка "Зарегистрироваться" (в окне регистрации)
    const regButton = document.querySelector('#registration-container button');
    if (regButton) {
        regButton.addEventListener('click', async () => {
            const bitrixId = document.getElementById('bitrix-id').value;
            if (!bitrixId) return alert('Введите ваш ID из Битрикс24');

            const res = await fetch('/api/save_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tg: tgNick, bitrix_id: bitrixId })
            });
            
            if (res.ok) {
                alert('Успешно! Теперь форма доступна.');
                location.reload(); // Перезагружаем, чтобы открылась форма
            }
        });
    }

    // Кнопка "Отправить" (сама форма)
    const form = document.getElementById('dynamic-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Собираем данные
            const formData = new FormData(form);
            const fields = {};
            formData.forEach((value, key) => {
                fields[key] = value;
            });

            // Отправляем в Битрикс через наш API
            try {
                const response = await fetch('/api/create_ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: fields })
                });

                const result = await response.json();
                if (result.status === 'success') {
                    alert('Заявка создана!');
                    if (window.Telegram?.WebApp) window.Telegram.WebApp.close();
                } else {
                    alert('Ошибка: ' + result.message);
                }
            } catch (err) {
                alert('Ошибка сети: ' + err.message);
            }
        });
    }
});

// Находим кнопку
const deleteBtn = document.getElementById('btn-delete-me');

if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
        // Подтверждение, чтобы не удалить случайно
        if (!confirm("Вы уверены, что хотите выйти и удалить свой ID из базы?")) return;

        try {
            const response = await fetch('/api/delete_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tg: tgNick })
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert("Данные удалены. Приложение будет перезагружено.");
                location.reload(); // После перезагрузки снова появится окно регистрации
            } else {
                alert("Ошибка: " + result.message);
            }
        } catch (err) {
            console.error("Ошибка при удалении:", err);
            alert("Не удалось связаться с сервером.");
        }
    });
}