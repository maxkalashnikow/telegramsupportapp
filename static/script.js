let currentBitrixUserId = null;
const urlParams = new URLSearchParams(window.location.search);
const tgNick = urlParams.get('tg');

// 1. Отрисовка полей
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

// 2. Регистрация
async function registerUser() {
    const bitrixId = document.getElementById('reg-bitrix-id').value;
    if (!bitrixId) return alert("Введите ID!");

    const response = await fetch('/api/save_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg: tgNick, bitrix_id: bitrixId })
    });

    if (response.ok) {
        alert("Зарегистрировано!");
        location.reload();












    }
}

// 3. Инициализация при загрузке
async function initApp() {
    console.log("Проверка ника:", tgNick);
    const regWin = document.getElementById('registration-container');
    const mainForm = document.getElementById('dynamic-form');



    if (!tgNick) {
        document.getElementById('form-container').innerHTML = "Ошибка: откройте через бота (?tg=nick)";






        return;
    }

    try {
        const res = await fetch(`/api/check_user?tg=${tgNick}`);
        const data = await res.json();


        if (data.status === 'found') {
            currentBitrixUserId = data.bitrix_id;
            regWin.style.display = 'none';
            mainForm.style.display = 'block';
            await loadForm();

   } else {
            regWin.style.display = 'block';
            mainForm.style.display = 'none';
        }
    } catch (e) {
        console.error("Ошибка initApp:", e);



    }
}

// Запуск
initApp();





























































































