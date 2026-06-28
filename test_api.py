import requests
import json

payload = {
  "gateId": 3,
  "plateNumber": "29A-12345",
  "vehicleType": "CAR",
  "rfid": "CARD001",
  "imageBase64": "base64",
  "lprImageBase64": "base64"
}

try:
    response = requests.post('http://localhost:8080/api/v1/iot/gates/checkin', json=payload)
    print("Status Code:", response.status_code)
    print("Response Body:", response.text)
except Exception as e:
    print("Error:", str(e))
