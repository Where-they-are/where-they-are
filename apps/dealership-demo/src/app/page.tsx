import { FeaturedCar } from "@/components/home/featured-car";
import { FinanceAndTrade } from "@/components/home/finance-and-trade";
import { HomeHero } from "@/components/home/hero";
import { ShopByMake } from "@/components/home/shop-by-make";
import { Showroom } from "@/components/home/showroom";
import { WhyRidgeline } from "@/components/home/why-ridgeline";

export default function HomePage() {
	return (
		<main>
			<HomeHero />
			<ShopByMake />
			<FeaturedCar />
			<Showroom />
			<WhyRidgeline />
			<FinanceAndTrade />
		</main>
	);
}
