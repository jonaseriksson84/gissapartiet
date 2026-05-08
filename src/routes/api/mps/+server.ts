import type { RequestHandler } from './$types';

const RIKSDAGEN_URL = 'https://data.riksdagen.se/personlista/?rdlaktiv=tjst&utformat=json';

// Proxy the MP list through our worker so visitors hit Cloudflare's cache
// instead of data.riksdagen.se directly. Riksdag's endpoint resets connections
// under load when many visitors fetch the full personlist independently.
export const GET: RequestHandler = async ({ fetch }) => {
	const upstream = await fetch(RIKSDAGEN_URL, {
		// @ts-expect-error - cf-specific request init
		cf: { cacheEverything: true, cacheTtl: 3600 }
	});

	if (!upstream.ok) {
		return new Response(`Riksdag upstream error: ${upstream.status}`, {
			status: 502,
			headers: { 'cache-control': 'no-store' }
		});
	}

	return new Response(upstream.body, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			// 1h browser/CDN cache + 24h stale-while-revalidate so visitors
			// always get an instant response even if Riksdag is being slow.
			'cache-control': 'public, max-age=3600, stale-while-revalidate=86400'
		}
	});
};
