const { test, expect } = require('../src/node_modules/@playwright/test');

test.describe('Roastery Ordering Flow', () => {
  const baseURL = process.env.BREW_URL || 'http://localhost:30287';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  test('should load the roastery homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Harbor Lane Coffee/);
    await expect(page.locator('h1')).toContainText('Harbor Lane Coffee - Roastery Demo');
    await expect(page.locator('.pr-banner')).toContainText('PR #87');
  });

  test('should add blends to the bag', async ({ page }) => {
    await page.locator('.blend-card .add-btn').nth(0).click();
    await expect(page.locator('#cart-lines')).not.toContainText('Your bag is empty');
    await expect(page.locator('#cart-lines')).toContainText('Morning Blend');
    await expect(page.locator('#cart-sum')).toContainText('18.50');
    await page.locator('.blend-card .add-btn').nth(1).click();
    await expect(page.locator('#cart-sum')).toContainText('40.50');
  });

  test('should remove a blend from the bag', async ({ page }) => {
    await page.locator('.blend-card .add-btn').nth(0).click();
    await page.locator('.blend-card .add-btn').nth(3).click();
    await expect(page.locator('#cart-lines')).toContainText('Morning Blend');
    await expect(page.locator('#cart-lines')).toContainText('Decaf Evening Mix');
    await page.locator('#cart-lines .remove-btn').nth(0).click();
    await expect(page.locator('#cart-lines')).not.toContainText('Morning Blend');
    await expect(page.locator('#cart-lines')).toContainText('Decaf Evening Mix');
    await expect(page.locator('#cart-sum')).toContainText('15.25');
  });

  test('should show the delivery note below the free-delivery threshold', async ({ page }) => {
    await expect(page.locator('#delivery-note')).toContainText('Add $60.00 more');
    await page.locator('.blend-card .add-btn').nth(0).click();
    await expect(page.locator('#delivery-note')).toContainText('Add $41.50 more');
  });

  test('should qualify for free delivery on a large order', async ({ page }) => {
    await page.locator('.blend-card .add-btn').nth(0).click();
    await page.locator('.blend-card .add-btn').nth(1).click();
    await page.locator('.blend-card .add-btn').nth(2).click();
    await page.locator('.blend-card .add-btn').nth(3).click();
    await expect(page.locator('#delivery-note')).toContainText('qualifies for free delivery');
  });

  test('should qualify for free delivery at exactly the stated threshold', async ({ page }) => {
    await page.locator('.blend-card .add-btn').nth(0).click();
    await page.locator('.blend-card .add-btn').nth(1).click();
    await page.locator('.blend-card .add-btn').nth(2).click();
    await expect(page.locator('#delivery-note')).toContainText('qualifies for free delivery');
  });

  test('should apply FRESH15 promo and update the order summary', async ({ page }) => {
    await page.locator('.blend-card .add-btn').nth(1).click();
    await page.fill('#promo-code', 'FRESH15');
    await page.click('#apply-promo');
    await expect(page.locator('#promo-status')).toContainText('applied');
    await expect(page.locator('#sum-promo')).toContainText('3.30');
  });

  test('should calculate tax after the promo discount (business rule)', async ({ page }) => {
    await page.locator('.blend-card .add-btn').nth(1).click();
    await page.fill('#promo-code', 'FRESH15');
    await page.click('#apply-promo');
    // discounted base = $22.00 - $3.30 = $18.70 -> 8% tax = $1.50
    await expect(page.locator('#sum-tax')).toContainText('1.50');
  });

  test('should complete the order and show the confirmation', async ({ page }) => {
    await page.locator('.blend-card .add-btn').nth(0).click();
    await page.fill('#cust-name', 'Alex Mercer');
    await page.fill('#cust-email', 'alex@example.com');
    await page.fill('#cust-addr', '12 Harbor Lane, Portside');
    await page.fill('#card-num', '4242424242424242');
    await page.click('#place-order');
    await expect(page.locator('#order-done')).toBeVisible();
    await expect(page.locator('#order-done')).toContainText('Order Confirmed');
    const ref = await page.locator('#order-ref').textContent();
    expect(ref).toMatch(/^BRW-[A-Z0-9]+$/);
  });

  test('should validate the required order fields', async ({ page }) => {
    await page.click('#place-order');
    const nameInput = page.locator('#cust-name');
    const validationMessage = await nameInput.evaluate(el => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should display the PR preview banner', async ({ page }) => {
    const banner = page.locator('.pr-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('PR #87');
    await expect(banner).toContainText('feature/pr-87');
  });

  test('should stay usable on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.order-form')).toBeVisible();
    await page.setViewportSize({ width: 800, height: 600 });
    await expect(page.locator('.blend-list')).toBeVisible();
  });

  test('performance: should render the homepage quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(4000);
  });
});

test.describe('API Health Checks', () => {
  const baseURL = process.env.BREW_URL || 'http://localhost:30287';

  test('should return 200 status for the homepage', async ({ request }) => {
    const response = await request.get(baseURL);
    expect(response.status()).toBe(200);
  });

  test('should serve html content type', async ({ request }) => {
    const response = await request.get(baseURL);
    expect(response.headers()['content-type']).toContain('text/html');
  });
});
