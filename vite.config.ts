import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
	server: {
		host: "::",
		port: 8080,
	},
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"favicon.ico",
				"apple-touch-icon.png",
				"icons/icon-192.png",
				"icons/icon-512.png",
			],
			manifest: {
				name: "Coliseu",
				short_name: "Coliseu",
				start_url: "/",
				display: "standalone",
				background_color: "#f8f1ea",
				theme_color: "#c96b3d",
				icons: [
					{
						src: "/icons/icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/icons/icon-512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "/icons/icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				navigateFallback: "/index.html",
				globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
				runtimeCaching: [
					{
						urlPattern: ({ request }) =>
							request.destination === "document" || request.destination === "script",
						handler: "NetworkFirst",
						options: {
							cacheName: "coliseu-pages",
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 7,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: ({ request }) =>
							request.destination === "style" || request.destination === "font",
						handler: "StaleWhileRevalidate",
						options: {
							cacheName: "coliseu-assets",
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 30,
							},
						},
					},
					{
						urlPattern: ({ request }) => request.destination === "image",
						handler: "CacheFirst",
						options: {
							cacheName: "coliseu-images",
							expiration: {
								maxEntries: 80,
								maxAgeSeconds: 60 * 60 * 24 * 30,
							},
						},
					},
				],
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
}));
