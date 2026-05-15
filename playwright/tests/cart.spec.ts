import { test, expect } from '@playwright/test';

test.describe('Cart Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display cart page', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('text=Shopping Cart')).toBeVisible();
  });

  test('should update item quantity', async ({ page }) => {
    await page.goto('/cart');
    const quantityInput = page.locator('[data-testid="quantity-input"]').first();
    await quantityInput.fill('2');
    await expect(quantityInput).toHaveValue('2');
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart');
    const removeButton = page.locator('[data-testid="remove-item"]').first();
    await removeButton.click();
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });
});
