import type { RequestHandler } from './$types';

// Riksdagen's photo URLs look like `{hash}_192.jpg` or `{hash}_max.jpg`. Whitelist
// strictly so we don't accidentally become an open proxy for arbitrary paths.
const FILE_RE = /^[a-zA-Z0-9-]+_(192|max)\.jpg$/;
const ONE_YEAR = 60 * 60 * 24 * 365;

// Cloudflare Workers exposes `caches.default` as a per-PoP Response cache. Declared
// locally so we don't pull in @cloudflare/workers-types just for this.
declare const caches: {
	default: {
		match(req: Request): Promise<Response | undefined>;
		put(req: Request, res: Response): Promise<void>;
	};
};

export const GET: RequestHandler = async ({ params, platform, request }) => {
	const file = params.file;
	if (!file || !FILE_RE.test(file)) {
		return new Response('bad filename', { status: 400 });
	}

	const cache = caches.default;
	const cacheKey = new Request(request.url, { method: 'GET' });

	// Fast path: serve from worker cache. If Riksdagen is currently resetting
	// connections, requests that have ever succeeded still resolve from here.
	const cached = await cache.match(cacheKey);
	if (cached) return cached;

	let upstream: Response;
	try {
		upstream = await fetch(
			`https://data.riksdagen.se/filarkiv/bilder/ledamot/${file}`,
			// @ts-expect-error cf-specific request init
			{ cf: { cacheEverything: true, cacheTtl: ONE_YEAR } }
		);
	} catch {
		return new Response('upstream unreachable', { status: 502 });
	}

	if (!upstream.ok) {
		return new Response('upstream error', { status: upstream.status });
	}

	const response = new Response(upstream.body, {
		headers: {
			'content-type': 'image/jpeg',
			'cache-control': `public, max-age=${ONE_YEAR}, immutable`
		}
	});

	platform?.context?.waitUntil(cache.put(cacheKey, response.clone()));

	return response;
};
