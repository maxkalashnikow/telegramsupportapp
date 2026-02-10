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

@app.route('/api/get_fields')
def get_fields():
    # ТВОИ ID ПОЛЕЙ СОХРАНЕНЫ ЗДЕСЬ
    return jsonify({
        "status": "success",
        "fields": {
            "title": {
                "title": "Суть обращения", 
                "type": "string"
            },
            "ufCrm13_1764583266": {
                "title": "Тип запроса (список)", 
                "type": "enumeration",
                "items": [
                    {"ID": "1", "VALUE": "Техподдержка"},
                    {"ID": "2", "VALUE": "Бухгалтерия"}
                ]
            },
            "ufCrm13_1764583294": {
                "title": "Прикрепите файл", 
                "type": "file"
            }
        }
    })

@app.route('/api/save_user', methods=['POST'])
def save_user():
    redis = get_redis()
    data = request.json
    redis.set(data.get('tg'), data.get('bitrix_id'))
    return jsonify({"status": "success"})