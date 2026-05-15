import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (would need auth setup)
    await page.goto('/');
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.getByRole('button', { name: 'Add to Cart' }).click();
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('should display checkout steps', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=Shipping')).toBeVisible();
    await expect(page.locator('text=Payment')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
  });
});
