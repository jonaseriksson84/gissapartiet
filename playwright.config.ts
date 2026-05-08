import { defineConfig, devices } from '@playwright/test';
import { readdirSync, existsSync } from 'fs';
import path from 'path';

function findChromiumExecutable(): string | undefined {
	// On Linux ARM64, the headless shell binary is x86_64 and will fail.
	// Find the full ARM64 Chromium binary instead.
	if (process.platform !== 'linux' || process.arch !== 'arm64') return undefined;

	const cacheDir = path.join(process.env.HOME ?? '/root', '.cache', 'ms-playwright');
	if (!existsSync(cacheDir)) return undefined;

	const chromiumDir = readdirSync(cacheDir).find((d) => d.startsWith('chromium-'));
	if (!chromiumDir) return undefined;

	const exe = path.join(cacheDir, chromiumDir, 'chrome-linux', 'chrome');
	return existsSync(exe) ? exe : undefined;
}

const chromiumExecutable = findChromiumExecutable();

export default defineConfig({
	testDir: './e2e',
	globalSetup: './e2e/global-setup.ts',
	use: {
		...devices['Desktop Chrome'],
		baseURL: 'http://localhost:8787',
		launchOptions: {
			args: ['--no-sandbox', '--disable-dev-shm-usage'],
			...(chromiumExecutable ? { executablePath: chromiumExecutable } : {})
		}
	},
	webServer: {
		command: 'npm run build && wrangler dev --local --port 8787',
		port: 8787,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
