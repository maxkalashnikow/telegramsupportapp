import os
from flask import Flask, jsonify
import requests

app = Flask(__name__)

# Данные твоего Битрикс24


@app.route('/api/get_fields')
def get_fields():
    # Получаем ID из параметров запроса, например: /api/get_fields?id=150
    entity_type_id = 1044
    BITRIX_URL = os.environ.get("BITRIX_URL")
       
    # Формируем запрос к Битрикс24
    method = "crm.item.fields"
    url = f"{BITRIX_URL}{method}?entityTypeId={entity_type_id}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        # Возвращаем только поля (result -> fields)
        if 'result' in data and 'fields' in data['result']:
            return jsonify(data['result']['fields'])
        else:
            return jsonify({"error": "Fields not found in Bitrix response"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run()