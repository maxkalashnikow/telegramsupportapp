from http.server import BaseHTTPRequestHandler
import json
import os
import requests

BITRIX_WEBHOOK_BASE = os.environ.get("BITRIX_URL")
DEFAULT_ENTITY_TYPE_ID = os.environ.get("ENTITY_TYPE_ID", "1044")


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        try:
            if not BITRIX_WEBHOOK_BASE:
                raise Exception("BITRIX_WEBHOOK_BASE is not set")

            # entityTypeId из URL: /api/get_fields?id=150
            entity_type_id = DEFAULT_ENTITY_TYPE_ID

            method = "crm.item.fields"
            url = f"{BITRIX_WEBHOOK_BASE}{method}?entityTypeId={entity_type_id}"

            response = requests.get(url, timeout=10)
            data = response.json()

            if "result" in data and "fields" in data["result"]:
                result = data["result"]["fields"]
                self.send_response(200)
            else:
                result = data
                self.send_response(500)

        except Exception as e:
            result = {"error": str(e)}
            self.send_response(500)

        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
