import requests
data = requests.get('http://localhost:8080/api/v1/iot/data-sync').json()
print([v['typeName'] for v in data['data']['vehicleTypes']])
