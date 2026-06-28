import { test, expect } from '@playwright/test';

// Define the accounts to use
const ACCOUNTS = {
  ADMIN: { email: 'systemadministratorweb@gmail.com', password: 'Fpt123456789@' },
  MANAGER: { email: 'systemmanagerweb@gmail.com', password: 'Fpt123456789@' },
  STAFF: { email: 'systemstaffwebsite@gmail.com', password: 'Fpt123456789@' },
  USER: { email: 'systemuserweb@gmail.com', password: 'Fpt123456789@' },
};

// Disable parallel execution inside this single test if needed, though we use contexts manually.
// We are going to open 5 contexts manually, so we don't rely on the built-in 'page' fixture.

test('Multi-role interaction test setup', async ({ browser }) => {
  // We set a long timeout because this test is meant to stay open for manual interaction
  test.setTimeout(0); 

  console.log('Creating browser contexts...');

  // Create isolated contexts for each role + IoT tool
  const adminContext = await browser.newContext();
  const managerContext = await browser.newContext();
  const staffContext = await browser.newContext();
  const userContext = await browser.newContext();
  const toolContext = await browser.newContext();

  // Open pages
  const adminPage = await adminContext.newPage();
  const managerPage = await managerContext.newPage();
  const staffPage = await staffContext.newPage();
  const userPage = await userContext.newPage();
  const toolPage = await toolContext.newPage();

  // Helper function to login
  const loginToApp = async (page, account, roleName) => {
    console.log(`Logging in ${roleName}...`);
    await page.goto('http://localhost:5173/login');
    // Wait for email input
    await page.waitForSelector('input[type="email"]');
    
    // Fill credentials
    await page.fill('input[type="email"]', account.email);
    // There are multiple password fields on the page (forgot password etc.), so we should target the first one or the visible one.
    // The placeholder is usually •••••••• for login.
    await page.fill('input[placeholder="••••••••"]', account.password);
    
    // Click submit
    await page.click('button[type="submit"]');

    // Wait for navigation or specific element to ensure login success
    // Wait until login screen is gone
    await page.waitForURL(url => !url.href.includes('/login'));
    console.log(`✅ ${roleName} logged in successfully.`);
  };

  // Execute all logins in parallel to save time
  await Promise.all([
    loginToApp(adminPage, ACCOUNTS.ADMIN, 'Admin'),
    loginToApp(managerPage, ACCOUNTS.MANAGER, 'Manager'),
    loginToApp(staffPage, ACCOUNTS.STAFF, 'Staff'),
    loginToApp(userPage, ACCOUNTS.USER, 'User'),
  ]);

  // Navigate to IoT Tool
  console.log('Opening IoT Tool on port 3001...');
  await toolPage.goto('http://localhost:3001/');

  console.log('🎉 Setup complete! All 5 browsers are ready for testing.');
  console.log('Pausing Playwright. You can now manually interact with the browsers.');
  console.log('To exit and stop the test, click the "Resume" button in Playwright Inspector or press Ctrl+C in terminal.');

  // Pause the test to keep browsers open for manual testing
  await adminPage.pause();
});
