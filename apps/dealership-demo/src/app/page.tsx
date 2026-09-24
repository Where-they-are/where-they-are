import { FeaturedCar } from "@/components/home/featured-car";
import { HomeHero } from "@/components/home/hero";
import { ShopByMake } from "@/components/home/shop-by-make";

export default function HomePage() {
	return (
		<main>
			<HomeHero />
			<ShopByMake />
			<FeaturedCar />
		</main>
	);
}
