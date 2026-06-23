import requests
import json

BASE_URL = "http://localhost:8080/api/v1/iot"

def test_data_sync():
    print("Testing GET /data-sync")
    resp = requests.get(f"{BASE_URL}/data-sync")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success! Current Simulated Time: {data['data']['currentTime']}")
    else:
        print(f"Failed! Status: {resp.status_code}, {resp.text}")

def test_fast_forward():
    print("\nTesting POST /time/fast-forward")
    payload = {"targetTime": "2027-10-10T10:00:00"}
    resp = requests.post(f"{BASE_URL}/time/fast-forward", json=payload)
    if resp.status_code == 200:
        print(f"Success! Response: {resp.json()}")
    else:
        print(f"Failed! Status: {resp.status_code}, {resp.text}")

if __name__ == "__main__":
    test_data_sync()
    test_fast_forward()
    test_data_sync()
