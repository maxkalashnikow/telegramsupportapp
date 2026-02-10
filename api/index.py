from flask import Flask, jsonify, request
import os
from upstash_redis import Redis

app = Flask(__name__)

def get_redis():
    return Redis(url=os.environ.get("KV_REST_API_URL"), token=os.environ.get("KV_REST_API_TOKEN"))

@app.route('/api/check_user')
def check_user():
    redis = get_redis()
    tg_nick = request.args.get('tg')
    bitrix_id = redis.get(tg_nick)
    if bitrix_id:
        return jsonify({"status": "found", "bitrix_id": str(bitrix_id)})
    return jsonify({"status": "not_found"})

@app.route('/api/save_user', methods=['POST'])
def save_user():
    redis = get_redis()
    data = request.json
    redis.set(data.get('tg'), data.get('bitrix_id'))
    return jsonify({"status": "success"})

@app.route('/api/get_fields')

from flask import Flask, jsonify, request
import os
import requests
from upstash_redis import Redis

app = Flask(__name__)

# Берем вебхук из переменных окружения Vercel
BITRIX_WEBHOOK = os.environ.get("BITRIX_WEBHOOK")

def get_redis():
    # Используем переменные KV для Redis
    return Redis(url=os.environ.get("KV_REST_API_URL"), token=os.environ.get("KV_REST_API_TOKEN"))

@app.route('/api/get_fields')
def get_fields():
    if not BITRIX_WEBHOOK:
        return jsonify({"status": "error", "message": "BITRIX_WEBHOOK env not set"}), 500

    try:
        # 141 — это чаще всего ID для смарт-процесса №13 (128 + 13)
        params = {"entityTypeId": 1044} 
        
        # Запрашиваем структуру полей напрямую из твоего Битрикса
        response = requests.get(f"{BITRIX_WEBHOOK}crm.item.fields", params=params)
        bitrix_data = response.json()
        
        if 'error' in bitrix_data:
            return jsonify({"status": "error", "message": bitrix_data['error_description']}), 500

        all_fields = bitrix_data.get('result', {}).get('fields', {})

        # ТВОИ РЕАЛЬНЫЕ ID ПОЛЕЙ
        target_ids = ['title', 'ufCrm13_1764583266', 'ufCrm13_1764583294']
        
        result_fields = {}

        for field_id in target_ids:
            if field_id in all_fields:
                f_info = all_fields[field_id]
                
                # Подтягиваем ВСЁ из Битрикса: и тип, и название (label)
                result_fields[field_id] = {
                    "title": f_info.get('formLabel') or f_info.get('title') or field_id,
                    "type": f_info.get('type'),
                }
                
                # Если поле — список (enumeration), забираем актуальные элементы
                if f_info.get('type') == 'enumeration':
                    result_fields[field_id]['items'] = f_info.get('items', [])

        return jsonify({
            "status": "success",
            "fields": result_fields
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Роуты для Redis (check_user и save_user) остаются как были