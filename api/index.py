from flask import Flask, jsonify, request
import os
import requests
from upstash_redis import Redis

app = Flask(__name__)

# Берем URL из твоего шаблона ENV
BITRIX_URL = os.environ.get("BITRIX_URL")
entity_type_id = int(os.environ.get("ENTITY_TYPE_ID", 0))

def get_redis():
    return Redis(url=os.environ.get("KV_REST_API_URL"), token=os.environ.get("KV_REST_API_TOKEN"))

@app.route('/api/get_fields')
def get_fields():
    if not BITRIX_URL:
        return jsonify({"status": "error", "message": "BITRIX_URL is missing in ENV"}), 500

    try:
                
        # Формируем корректный путь к методу
        base_url = BITRIX_URL.strip()
        if not base_url.endswith('/'):
            base_url += '/'
        
        api_method = f"{base_url}crm.item.fields"
        
        # Запрос к Битриксу
        response = requests.get(api_method, params={"entityTypeId": entity_type_id}, timeout=10)
        bitrix_data = response.json()

        if 'error' in bitrix_data:
            return jsonify({
                "status": "error", 
                "message": bitrix_data.get('error_description'),
                "error_code": bitrix_data.get('error')
            }), 500

        all_fields = bitrix_data.get('result', {}).get('fields', {})
        
        target_ids = os.getenv("TARGET_IDS", "").split(',')
        
        result_fields = {}
        for field_id in target_ids:
            if field_id in all_fields:
                f_info = all_fields[field_id]
                result_fields[field_id] = {
                    "title": f_info.get('formLabel') or f_info.get('title') or field_id,
                    "type": f_info.get('type'),
                    "items": f_info.get('items', []) if f_info.get('type') == 'enumeration' else []
                }
            else:
                # Если поле не найдено в Битриксе, оставляем заглушку, чтобы JS не падал
                result_fields[field_id] = {"title": field_id, "type": "string"}

        return jsonify({"status": "success", "fields": result_fields})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/create_ticket', methods=['POST'])
def create_ticket():
    if not BITRIX_URL:
        return jsonify({"status": "error", "message": "BITRIX_URL is missing"}), 500
    
    try:
        data = request.json  # Данные из формы
        base_url = BITRIX_URL.strip().rstrip('/') + '/'
        
        # Для Смарт-процессов используется метод crm.item.add
        api_method = f"{base_url}crm.item.add"
        
        payload = {
            "entityTypeId": entity_type_id,
            "fields": data.get('fields', {})
        }
        
        response = requests.post(api_method, json=payload, timeout=10)
        result = response.json()
        
        if 'error' in result:
            return jsonify({"status": "error", "message": result.get('error_description')}), 500
            
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
# Роуты для Redis
@app.route('/api/check_user')
def check_user():
    redis = get_redis()
    tg_nick = request.args.get('tg')
    if not tg_nick: return jsonify({"status": "error"}), 400
    bitrix_id = redis.get(tg_nick)
    return jsonify({"status": "found" if bitrix_id else "not_found", "bitrix_id": str(bitrix_id) if bitrix_id else None})

@app.route('/api/save_user', methods=['POST'])
def save_user():
    redis = get_redis()
    data = request.json
    if data.get('tg') and data.get('bitrix_id'):
        redis.set(data.get('tg'), data.get('bitrix_id'))
        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 400

@app.route('/api/delete_user', methods=['POST'])
def delete_user():
    try:
        redis = get_redis()
        data = request.json
        tg_nick = data.get('tg')
        
        if tg_nick:
            redis.delete(tg_nick) # Удаляем ключ из базы
            return jsonify({"status": "success", "message": "Пользователь удален"})
        return jsonify({"status": "error", "message": "Ник не указан"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500