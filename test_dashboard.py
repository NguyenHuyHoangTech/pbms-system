from playwright.sync_api import sync_playwright
import time

def test_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173/login')
        page.fill('input[type="email"]', 'manager1@pbms.vn')
        page.fill('input[type="password"]', 'password')
        page.click('button[type="submit"]')
        time.sleep(2)
        page.goto('http://localhost:5173/dashboard')
        time.sleep(3)
        page.screenshot(path='dashboard_screenshot.png', full_page=True)
        browser.close()

test_login()
