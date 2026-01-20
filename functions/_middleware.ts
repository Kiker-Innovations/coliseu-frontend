// Cloudflare Pages Functions middleware for SPA routing
// This ensures all routes are handled by the SPA

export const onRequest: PagesFunction = async (context) => {
	const url = new URL(context.request.url);
	const pathname = url.pathname;

	// Skip API routes if you have any
	if (pathname.startsWith('/api/')) {
		return context.next();
	}

	// Skip static assets
	const staticExtensions = [
		'.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
		'.ico', '.webp', '.woff', '.woff2', '.ttf', '.eot',
		'.webmanifest', '.json', '.txt', '.xml'
	];

	if (staticExtensions.some(ext => pathname.endsWith(ext))) {
		return context.next();
	}

	// Skip known static paths
	if (pathname.startsWith('/assets/') || pathname.startsWith('/icons/')) {
		return context.next();
	}

	// Try to serve the request normally first
	const response = await context.next();

	// If it's a 404, serve index.html instead for SPA routing
	if (response.status === 404) {
		const url = new URL('/index.html', context.request.url);
		const asset = await context.env.ASSETS.fetch(url);
		
		return new Response(asset.body, {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
			},
		});
	}

	return response;
};

