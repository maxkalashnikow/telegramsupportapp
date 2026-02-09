from flask import Flask, jsonify, request
import requests
import os
from upstash_redis import Redis

app = Flask(__name__)

# Инициализация Redis через переменные Vercel KV
def get_redis():
    url = os.environ.get("KV_REST_API_URL")
    token = os.environ.get("KV_REST_API_TOKEN")
    if not url or not token:
        return None
    return Redis(url=url, token=token)

@app.route('/api/get_fields')
def get_fields():
    return jsonify({
        "status": "success",
        "fields": {
            "TITLE": {"title": "Тема", "type": "string"},
            "UF_CRM_CATEGORY": {
                "title": "Категория", 
                "type": "enumeration", 
                "items": [
                    {"ID": "1", "VALUE": "Техническая поддержка"},
                    {"ID": "2", "VALUE": "Финансы"}
                ]
            },
            "UF_CRM_FILE": {"title": "Скриншот", "type": "file"}
        }
    })

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
    # ВАЖНО: Замени этот словарь на реальный вызов Битрикс24, если нужно.
    # Сейчас это тестовые данные, чтобы форма отрисовалась.
    return jsonify({
        "status": "success",
        "fields": {
            "TITLE": {"title": "Тема обращения", "type": "string"},
            "COMMENTS": {"title": "Описание проблемы", "type": "text"},
            "FILE": {"title": "Скриншот", "type": "file"}
        }
    })