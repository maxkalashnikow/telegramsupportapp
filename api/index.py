import os
import requests
from flask import Flask, jsonify, request
from dotenv import load_dotenv
from upstash_redis import Redis

load_dotenv()
app = Flask(__name__)

from flask import Flask, jsonify, request
import requests
import os
from upstash_redis import Redis

app = Flask(__name__)

# Прямая инициализация через переменные Vercel KV
def get_redis():
    # Используем именно те имена, которые видны на твоем скриншоте
    url = os.environ.get("KV_REST_API_URL")
    token = os.environ.get("KV_REST_API_TOKEN")
    
    if not url or not token:
        print("ОШИБКА: Переменные KV не найдены в окружении!")
        return None
        
    return Redis(url=url, token=token)

@app.route('/api/check_user')
def check_user():
    redis = get_redis()
    if not redis:
        return jsonify({"status": "error", "message": "Database config missing"}), 500
        
    tg_nick = request.args.get('tg')
    if not tg_nick:
        return jsonify({"status": "error", "message": "No nickname provided"}), 400
    
    try:
        # Пытаемся получить ID из базы
        bitrix_id = redis.get(tg_nick)
        if bitrix_id:
            return jsonify({"status": "found", "bitrix_id": bitrix_id})
        return jsonify({"status": "not_found"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/save_user', methods=['POST'])
def save_user():
    redis = get_redis()
    data = request.json
    tg_nick = data.get('tg')
    bitrix_id = data.get('bitrix_id')
    
    if redis and tg_nick and bitrix_id:
        redis.set(tg_nick, bitrix_id)
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Invalid data or DB error"}), 400
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

@app.route('/api/create_item', methods=['POST'])
def create_item():
    bitrix_url = os.environ.get("BITRIX_URL")
    entity_type_id = 1044  # Твой ID смарт-процесса
    
    try:
        # Получаем данные из JS (мы будем отправлять JSON)
        incoming_data = request.json
        
        # Формируем запрос к Битриксу
        # Метод crm.item.add для смарт-процессов
        method = "crm.item.add"
        url = f"{bitrix_url}{method}"
        
        payload = {
            "entityTypeId": entity_type_id,
            "fields": incoming_data
        }
        
        response = requests.post(url, json=payload)
        result = response.json()
        
        if 'result' in result:
            return jsonify({"status": "success", "id": result['result']['item']['id']})
        else:
            return jsonify({"status": "error", "details": result}), 400

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
    
if __name__ == '__main__':
    app.run(debug=True)