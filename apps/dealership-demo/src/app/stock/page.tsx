import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { StockBrowser } from "@/components/stock/stock-browser";

export const metadata: Metadata = {
	description:
		"Browse the sample stock at Ridgeline Motors, a fictional Harare dealership: filter by body type, price, fuel, make, year and gearbox.",
	title: "Stock",
};

export default function StockPage() {
	return (
		<>
			<SiteHeader />
			<Suspense>
				<StockBrowser />
			</Suspense>
		</>
	);
}
