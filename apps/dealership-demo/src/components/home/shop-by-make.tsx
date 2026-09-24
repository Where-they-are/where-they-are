import type { Route } from "next";
import Link from "next/link";

import { Icon } from "@/components/icons";
import { cn } from "@/components/ui";
import { countBy } from "@/lib/stock";
import { featuredMakes, vehicles } from "@/lib/vehicles";

export function ShopByMake() {
	const counts = countBy(vehicles, (vehicle) => vehicle.make);
	const topMake = Object.entries(counts).sort(
		(a, b) => (b[1] ?? 0) - (a[1] ?? 0)
	)[0]?.[0];
	return (
		<section
			aria-labelledby="makes-heading"
			className="container-page pt-14 pb-12 lg:pt-24 lg:pb-[104px]"
		>
			<div className="flex items-end justify-between gap-4">
				<h2
					className="font-semibold text-[28px] tracking-[-0.03em] sm:text-[36px] lg:text-[44px]"
					id="makes-heading"
				>
					Shop by make
				</h2>
				<Link
					className="hidden items-center gap-1.5 pb-2 font-semibold text-[14.5px] hover:text-accent sm:flex"
					href="/stock"
				>
					All {featuredMakes.length} makes
					<Icon name="arrow" size={16} />
				</Link>
			</div>
			<ul className="scrollbar-none -mx-5 mt-6 flex snap-x scroll-px-5 gap-2.5 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-4 md:px-0 lg:mt-8 lg:grid-cols-6">
				{featuredMakes.map((make) => {
					const count = counts[make] ?? 0;
					const isTop = make === topMake;
					return (
						<li className="shrink-0 snap-start" key={make}>
							<Link
								className={cn(
									"flex h-[74px] min-w-[104px] flex-col items-center justify-center gap-1 rounded-2xl px-4 transition-colors md:h-[96px] lg:h-[104px]",
									isTop ? "bg-ink text-white" : "bg-soft text-ink hover:bg-line"
								)}
								href={`/stock?make=${encodeURIComponent(make)}` as Route}
							>
								<span className="whitespace-nowrap font-semibold text-[16px] tracking-[-0.01em] lg:text-[19px]">
									{make}
								</span>
								<span
									className={cn(
										"font-mono text-[11.5px] lg:text-[12.5px]",
										isTop ? "text-white/60" : "text-muted"
									)}
								>
									{count > 0
										? `${count} ${count === 1 ? "car" : "cars"}`
										: "On request"}
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
