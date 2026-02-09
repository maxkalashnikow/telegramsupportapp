const tele = window.Telegram.WebApp;
tele.ready();
tele.expand();

const tgUser = tele.initDataUnsafe?.user;
const tgNick = tgUser?.username || tgUser?.id?.toString(); 
let currentBitrixUserId = null;

async function initApp() {
    const regWin = document.getElementById('registration-container');
    const mainForm = document.getElementById('dynamic-form');

    if (!tgNick) {
        document.getElementById('form-container').innerHTML = 
            "<div class='error'>Пожалуйста, откройте приложение через Telegram бота.</div>";
        return;
    }

    try {
        const response = await fetch(`/api/check_user?tg=${tgNick}`);
        const data = await response.json();

        if (data.status === 'found') {
            currentBitrixUserId = data.bitrix_id;
            regWin.style.display = 'none';
            mainForm.style.display = 'block';
            await loadForm();
        } else {
            regWin.style.display = 'block';
            mainForm.style.display = 'none';
        }
    } catch (err) {
        console.error("Ошибка входа:", err);
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
                wrapper.className = 'field-group'; // Класс для твоего CSS

                const label = document.createElement('label');
                label.innerHTML = `<b>${info.title || id}</b>`;
                wrapper.appendChild(label);

                let input;
                // 1. Обработка СПИСКОВОГО поля
                if (info.type === 'enumeration' && info.items) {
                    input = document.createElement('select');
                    info.items.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.ID;
                        opt.textContent = item.VALUE;
                        input.appendChild(opt);
                    });
                } 
                // 2. Обработка ФАЙЛА (с твоим дизайном)
                else if (info.type === 'file') {
                    const fileWrapper = document.createElement('div');
                    fileWrapper.className = 'file-input-wrapper';

                    input = document.createElement('input');
                    input.type = 'file';
                    input.id = 'file_' + id;
                    input.className = 'file-input';

                    const fileLabel = document.createElement('label');
                    fileLabel.htmlFor = 'file_' + id;
                    fileLabel.className = 'file-label';
                    fileLabel.textContent = 'Выберите файл';

                    fileWrapper.appendChild(input);
                    fileWrapper.appendChild(fileLabel);
                    wrapper.appendChild(fileWrapper);
                    
                    // Слушатель для изменения текста кнопки
                    input.addEventListener('change', e => {
                        fileLabel.textContent = e.target.files[0]?.name || 'Выберите файл';
                    });
                } 
                // 3. ОБЫЧНОЕ поле
                else {
                    input = document.createElement('input');
                    input.type = (info.type === 'number') ? 'number' : 'text';
                }

                if (info.type !== 'file') {
                    input.name = id;
                    wrapper.appendChild(input);
                }
                container.appendChild(wrapper);
            });
        }
    } catch (e) {
        console.error("Ошибка отрисовки:", e);
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
    if (response.ok) location.reload();
}

document.addEventListener('DOMContentLoaded', initApp);