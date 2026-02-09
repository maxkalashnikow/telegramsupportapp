async function loadForm() {
    console.log("1. Скрипт запущен");
    try {
        const response = await fetch('/api/get_fields');
        console.log("2. Ответ от сервера получен:", response.status);
        
        const data = await response.json();
        console.log("3. Данные (JSON):", data);

        const container = document.getElementById('form-container');
        
        if (Object.keys(data.fields).length === 0) {
            container.innerHTML = '<p>Битрикс вернул пустой список полей. Проверь ALLOWED_FIELDS в Python!</p>';
            return;
        }

        container.innerHTML = ''; 
        // ... твой код цикла полей ...
        console.log("4. Цикл отрисовки завершен");

    } catch (error) {
        console.error("ОШИБКА ТУТ:", error);
    }
}