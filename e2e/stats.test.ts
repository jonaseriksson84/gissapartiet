import { test, expect } from '@playwright/test';

test('stats page renders all sections with seeded data', async ({ page }) => {
	await page.goto('/stats');

	// Page heading
	await expect(page.getByRole('heading', { name: 'Statistik' })).toBeVisible();

	// Counters are non-zero: seed has 8 parties × 2 MPs × 20 events = 320 votes
	await expect(page.getByText('320')).toBeVisible();

	// Accuracy table is populated: S party has 40 total events (2 MPs × 20)
	await expect(page.getByRole('heading', { name: 'Träffsäkerhet per parti' })).toBeVisible();
	const sRow = page.getByRole('row').filter({ hasText: 'Socialdemokraterna' });
	await expect(sRow.getByText('40')).toBeVisible();

	// Confusion matrix is populated: each party has 50% correct, 50% wrong (diagonal = 50%)
	await expect(page.getByRole('heading', { name: 'Förväxlingsmatris' })).toBeVisible();
	await expect(page.getByText('50%').first()).toBeVisible();

	// Easiest MPs section: mp1 per party has 75% accuracy with 20 events (≥ 15 floor)
	await expect(page.getByRole('heading', { name: 'Lättast att gissa' })).toBeVisible();
	// Name falls back to MP ID since test_ IDs are not real riksdagen MPs
	await expect(page.getByText('test_S_1').first()).toBeVisible();

	// Hardest MPs section: mp2 per party has 25% accuracy with 20 events
	await expect(page.getByRole('heading', { name: 'Svårast att gissa' })).toBeVisible();
	await expect(page.getByText('test_S_2').first()).toBeVisible();

	// Misidentification section: S MPs guessed as M show up under Moderaterna
	await expect(
		page.getByRole('heading', { name: 'Verkar tillhöra ett annat parti' })
	).toBeVisible();
	// test_S_2 has 15 wrong guesses as M → top entry in M's misidentification list
	await expect(page.getByText('15×')).toBeVisible();
});
