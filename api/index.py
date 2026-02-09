import os
import requests
from flask import Flask, jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# 1. Твой белый список полей (добавь сюда ID своих полей из Битрикса)
ALLOWED_FIELDS = [
    'title',                # Название
    'ufCrm13_1764583294',            # Файловое
    'ufCrm13_1764583266'   # Списковое
     # Поле для файлов
]

@app.route('/api/get_fields')
def get_fields():
    bitrix_url = os.environ.get("BITRIX_URL")
    entity_type_id = 1044
    
    # Запрос всех полей смарт-процесса
    method = "crm.item.fields"
    url = f"{bitrix_url}{method}?entityTypeId={entity_type_id}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if 'result' not in data:
            return jsonify({"error": "Failed to get fields from Bitrix", "details": data}), 400
            
        all_fields = data['result']['fields']
        
        # 2. Фильтрация по белому списку
        filtered_fields = {}
        for field_id in ALLOWED_FIELDS:
            if field_id in all_fields:
                field_data = all_fields[field_id]
                
                # Собираем только нужную информацию для фронтенда
                filtered_fields[field_id] = {
                    "title": field_data.get('title'),
                    "type": field_data.get('type'),
                    "isRequired": field_data.get('isRequired', False),
                }
                
                # 3. Если это список (enumeration), забираем варианты выбора
                if field_data.get('type') == 'enumeration':
                    filtered_fields[field_id]['items'] = field_data.get('items', [])

        return jsonify({"status": "success", "fields": filtered_fields})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)