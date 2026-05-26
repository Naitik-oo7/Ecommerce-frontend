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

  // Issue #26: Additional comprehensive checkout tests
  test('StepIndicator should highlight current step', async ({ page }) => {
    await page.goto('/checkout');
    // Shipping step should be active initially
    const shippingStep = page.locator('[data-testid="step-shipping"]').first();
    await expect(shippingStep).toHaveAttribute('data-active', 'true');
    // Payment and Review steps should be inactive
    const paymentStep = page.locator('[data-testid="step-payment"]').first();
    const reviewStep = page.locator('[data-testid="step-review"]').first();
    await expect(paymentStep).toHaveAttribute('data-active', 'false');
    await expect(reviewStep).toHaveAttribute('data-active', 'false');
  });

  test('ShippingStep should require address selection', async ({ page }) => {
    await page.goto('/checkout');
    // Try to proceed without selecting address
    const continueButton = page.getByRole('button', { name: /continue|next/i }).first();
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      // Should show error or validation message
      await expect(page.locator('text=/select.*address|address.*required/i')).toBeVisible();
    }
  });

  test('should complete full checkout flow', async ({ page }) => {
    // Start from products page
    await page.goto('/products');
    
    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.getByRole('button', { name: 'Add to Cart' }).click();
    
    // Wait for cart update
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Navigate to cart
    await page.goto('/cart');
    await expect(page.locator('text=/cart|shopping bag/i')).toBeVisible();
    
    // Proceed to checkout
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout/);
    
    // Verify checkout page loads with all steps
    await expect(page.locator('text=Shipping')).toBeVisible();
    await expect(page.locator('text=Payment')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
    
    // Verify ShippingStep form elements
    await expect(page.locator('text=/shipping|delivery/i')).toBeVisible();
  });

  test('should handle COD payment method selection', async ({ page }) => {
    await page.goto('/checkout');
    
    // Look for payment method options
    const codOption = page.locator('text=/cash on delivery|cod/i').first();
    if (await codOption.isVisible().catch(() => false)) {
      await codOption.click();
      // Verify COD is selected
      await expect(codOption).toHaveClass(/selected|active/i);
    }
  });
});
