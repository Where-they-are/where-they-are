import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { SampleBanner } from "@/components/sample-banner";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

const geist = localFont({
	display: "swap",
	src: "./fonts/geist-latin.woff2",
	variable: "--font-geist",
	weight: "100 900",
});

const geistMono = localFont({
	display: "swap",
	src: "./fonts/geist-mono-latin.woff2",
	variable: "--font-geist-mono",
	weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

export const metadata: Metadata = {
	description:
		"A sample car dealership website made by the team at Where They Are. Ridgeline Motors is a fictional dealership used to show what your dealership's site could look like.",
	metadataBase: new URL(siteUrl),
	// The dealership is fictional, so keep it out of search results.
	robots: { follow: false, index: false },
	title: {
		default: "Ridgeline Motors · Sample dealership site by Where They Are",
		template: "%s · Ridgeline Motors (sample site)",
	},
};

export const viewport: Viewport = {
	initialScale: 1,
	themeColor: "#0e0f11",
	width: "device-width",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable} ${geistMono.variable}`} lang="en">
			<body className="flex min-h-svh flex-col antialiased">
				<a
					className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
					href="#main"
				>
					Skip to content
				</a>
				<SampleBanner />
				<div className="flex-1">{children}</div>
				<SiteFooter />
			</body>
		</html>
	);
}
