import { test, expect } from '@playwright/test';

const PARTIES = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L'] as const;
const TRANSPARENT_GIF =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const RIKSDAG_FIXTURE = {
	personlista: {
		person: PARTIES.map((p) => ({
			intressent_id: `test_${p}_001`,
			tilltalsnamn: 'Test',
			efternamn: p,
			parti: p,
			bild_url_192: TRANSPARENT_GIF,
			bild_url_max: TRANSPARENT_GIF
		}))
	}
};

test('happy-path round flow', async ({ page }) => {
	await page.route('https://data.riksdagen.se/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(RIKSDAG_FIXTURE)
		})
	);

	await page.goto('/');

	// Wait for MPs to load
	await expect(page.getByText(/8 ledamöter inlästa/)).toBeVisible();

	// Photo card is visible
	await expect(page.locator('main img[alt=""]').first()).toBeVisible();

	// Initial score shows 0/0
	await expect(page.getByText('0/0')).toBeVisible();

	// Click a party button
	await page.getByRole('button', { name: 'Socialdemokraterna' }).click();

	// Score updates: one round has been played
	await expect(page.getByText(/[01]\/1/)).toBeVisible();

	// Correct button shows ✓ badge
	await expect(page.getByText('✓').first()).toBeVisible();

	// After dwell, reveal disappears and next MP is ready
	await page.waitForTimeout(2000);

	// Can make a second guess
	await page.getByRole('button', { name: 'Moderaterna' }).click();
	await expect(page.getByText(/[012]\/2/)).toBeVisible();
});
