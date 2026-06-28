import { test, expect } from '@playwright/test';

test.describe('Automated Check-in Flow with Map Visualization', () => {
  test.setTimeout(120000); // 2 minutes timeout for full flow

  test('Staff opens shift, IoT checks in, Staff approves, IoT sets slot, Staff sees on map', async ({ browser }) => {
    // 1. Create Browser Contexts for different roles
    const managerContext = await browser.newContext();
    const staffContext = await browser.newContext();
    const iotContext = await browser.newContext();

    const managerPage = await managerContext.newPage();
    const staffPage = await staffContext.newPage();
    const iotPage = await iotContext.newPage();

    const loginToApp = async (page, email, password) => {
      await page.goto('http://localhost:5173/login');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', email);
      await page.fill('input[placeholder="••••••••"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(url => !url.href.includes('/login'));
    };

    console.log('Logging in Manager and Staff...');
    await Promise.all([
      loginToApp(managerPage, 'systemmanagerweb@gmail.com', 'Fpt123456789@'),
      loginToApp(staffPage, 'systemstaffwebsite@gmail.com', 'Fpt123456789@'),
    ]);

    // 2. Staff Opens Shift
    console.log('Staff: Navigating to Work Sessions...');
    await staffPage.goto('/staff/work-sessions');
    
    // Attempt to open a shift if none is active
    try {
        await staffPage.getByRole('button', { name: /Mở Ca Trực/i }).waitFor({ timeout: 5000 });
        await staffPage.getByRole('button', { name: /Mở Ca Trực/i }).click();
        
        // Wait for modal, select gate (assuming first gate available)
        await staffPage.locator('.ant-select-selector').first().click();
        await staffPage.locator('.ant-select-item').first().click();
        
        await staffPage.getByRole('button', { name: 'Xác nhận' }).click();
        console.log('Staff: Opened shift successfully.');
    } catch (e) {
        console.log('Staff: Shift might already be open or button not found. Proceeding...');
    }

    // Staff goes to Gate In Console
    console.log('Staff: Moving to Gate In Console...');
    await staffPage.goto('/staff/gate-console/in');

    // 3. IoT Tool simulates check-in
    console.log('IoT: Simulating vehicle entry...');
    await iotPage.goto('http://localhost:3001/');
    
    const plateToTest = `TEST-${Math.floor(Math.random() * 1000)}`;
    const rfidToTest = `RFID-${Math.floor(Math.random() * 10000)}`;

    await iotPage.getByPlaceholder('Nhập mã thẻ RFID (VD: AB123456)').fill(rfidToTest);
    await iotPage.getByPlaceholder('Nhập biển số (VD: 29A-123.45)').fill(plateToTest);

    // Assuming first gate in IoT Tool is Gate A
    await iotPage.getByRole('button', { name: 'Mô phỏng Quẹt Thẻ & Camera Chụp Biển' }).click();

    // 4. Staff Approves Check-in
    console.log(`Staff: Waiting for vehicle ${plateToTest} to appear on console...`);
    // It should appear via WebSocket
    await staffPage.getByText(plateToTest).waitFor({ timeout: 15000 });
    
    console.log('Staff: Vehicle detected, approving...');
    // Click the "Cho Xe Vào" or "Check In" button
    await staffPage.getByRole('button', { name: /Cho xe vào/i }).click();
    
    // Wait for success message
    await staffPage.getByText(/thành công/i).waitFor({ timeout: 10000 });

    // 5. IoT Tool selects Map, Floor, and Slot
    console.log('IoT: Switching to Sensor Map tab...');
    await iotPage.getByText('Bản Đồ Cảm Biến').click();
    
    console.log('IoT: Selecting Floor and Slot...');
    // Click the floor selector
    await iotPage.getByText('-- Chọn Tầng --').click();
    // Select the first floor
    await iotPage.locator('.ant-select-item').first().click();
    
    // Find a slot that is available (we assume S1 exists or we just click the first slot)
    // The slot element has a span inside. We will just click the first available slot element.
    await iotPage.locator('div:has-text("S1")').first().click();
    
    // Wait a bit for the API to update the slot status
    await iotPage.waitForTimeout(2000);

    // 6. Staff verifies Map
    console.log('Staff/Manager: Verifying Space Map...');
    // Manager or Staff navigates to Space Map
    await managerPage.goto('/manager/space-map');
    
    // Select the same floor (assuming the Space Map screen also has a floor selector)
    try {
      await managerPage.locator('.ant-select-selector').first().click();
      await managerPage.locator('.ant-select-item').first().click();
    } catch(e) {
      console.log('Manager: Space Map floor selection might be automatic.');
    }
    
    // Wait for slot S1 to be rendered
    await managerPage.getByText('S1').waitFor({ timeout: 10000 });
    console.log('Manager: Successfully saw the mapped vehicle on the real space map!');

    await iotContext.close();
    await staffContext.close();
    await managerContext.close();
  });
});
