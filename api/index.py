from flask import Flask, jsonify, request
import requests
import os
from upstash_redis import Redis

app = Flask(__name__)

# Используем переменные KV, которые мы видели на скриншоте
def get_redis():
    url = os.environ.get("KV_REST_API_URL")
    token = os.environ.get("KV_REST_API_TOKEN")
    if not url or not token:
        return None
    return Redis(url=url, token=token)

@app.route('/api/check_user')
def check_user():
    redis = get_redis()
    if not redis:
        return jsonify({"status": "error", "message": "DB config missing"}), 500
    
    tg_nick = request.args.get('tg')
    if not tg_nick:
        return jsonify({"status": "error", "message": "No nickname"}), 400
    
    # Пытаемся получить ID. Если ника нет, вернется None
    bitrix_id = redis.get(tg_nick)
    if bitrix_id:
        # Убеждаемся, что возвращаем строку или число
        return jsonify({"status": "found", "bitrix_id": str(bitrix_id)})
    return jsonify({"status": "not_found"})

@app.route('/api/save_user', methods=['POST'])
def save_user():
    redis = get_redis()
    data = request.json
    tg_nick = data.get('tg')
    bitrix_id = data.get('bitrix_id')
    
    if redis and tg_nick and bitrix_id:
        redis.set(tg_nick, bitrix_id)
        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 400

@app.route('/api/get_fields')
def get_fields():
    # ТВОЙ КОД ЗАПРОСА К БИТРИКСУ
    # Здесь должен быть вызов метода user.fields или crm.item.fields
    # Для теста я возвращаю структуру, которую ждет твой JS:
    test_fields = {
        "status": "success",
        "fields": {
            "TITLE": {"title": "Название задачи", "type": "string"},
            "UF_CRM_123": {"title": "ID пользователя", "type": "number"}
        }
    }
    return jsonify(test_fields)