import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { SearchPanel } from "@/components/home/search-panel";
import { Icon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { ArrowBadge, buttonClass } from "@/components/ui";
import { vehicleHref } from "@/components/vehicle-card";
import { formatPrice } from "@/lib/format";
import { featuredVehicle, vehicles, vehicleTitle } from "@/lib/vehicles";

export function HomeHero() {
	const featured = featuredVehicle;
	return (
		<section aria-label="Welcome" className="relative">
			<div className="relative lg:mx-3 lg:mt-3">
				<SiteHeader overlay />
				<div className="relative mx-3 h-[520px] overflow-hidden rounded-[26px] bg-[#1b1c1f] sm:h-[600px] lg:mx-0 lg:h-[820px]">
					<Image
						alt="White Toyota Land Cruiser parked on a hillside"
						className="object-cover object-[70%_center] lg:object-center"
						fill
						priority
						sizes="100vw"
						src="/cars/land-cruiser-hero.webp"
					/>
					<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(14,15,17,0.55)_0%,rgba(14,15,17,0)_30%,rgba(14,15,17,0)_55%,rgba(14,15,17,0.85)_100%)]" />
					<p
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 top-5 select-none text-center font-bold text-[clamp(64px,16.4vw,236px)] text-white/95 leading-[0.8] tracking-[-0.055em] lg:top-[92px]"
					>
						RIDGELINE
					</p>

					<div
						className="absolute inset-x-5 bottom-20 flex flex-col gap-3 text-white sm:inset-x-8 sm:bottom-24 lg:right-auto lg:bottom-[120px] lg:left-12 lg:max-w-[520px] lg:gap-[22px]"
						id="main"
					>
						<h1 className="font-semibold text-[27px] leading-[1.15] tracking-[-0.02em] sm:text-[34px] lg:font-medium lg:text-[22px] lg:leading-[1.4] lg:tracking-normal">
							<span className="lg:hidden">
								New and pre-owned cars in Harare, priced up front.
							</span>
							<span className="hidden lg:inline">
								New and pre-owned cars in Harare, inspected, priced up front and
								ready to drive home.
							</span>
						</h1>
						<p className="text-[14.5px] text-white/85 lg:hidden">
							{vehicles.length} cars in stock · updated today
						</p>
						<div className="hidden gap-2.5 lg:flex">
							<Link className={buttonClass({ size: "lg" })} href="/stock">
								Browse {vehicles.length} cars
								<ArrowBadge />
							</Link>
							<Link
								className={buttonClass({ size: "lg", variant: "ghost-dark" })}
								href="/sell"
							>
								Sell your car
							</Link>
						</div>
					</div>

					<Link
						className="absolute right-10 bottom-[120px] hidden w-[320px] flex-col gap-3 rounded-[20px] bg-white/14 p-4 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] backdrop-blur-[18px] transition-colors hover:bg-white/20 lg:flex"
						href={vehicleHref(featured) as Route}
					>
						<span className="flex items-center justify-between">
							<span className="inline-flex h-[26px] items-center rounded-full bg-accent px-2.5 font-bold text-[12px] text-ink">
								Just arrived
							</span>
							<span className="font-mono text-[12.5px] text-white/80">
								{featured.stockNumber}
							</span>
						</span>
						<span className="font-semibold text-[18px] leading-tight">
							{vehicleTitle(featured)}
						</span>
						<span className="flex items-center justify-between pt-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
							<span className="font-bold text-[22px]">
								{formatPrice(featured.price)}
							</span>
							<span className="flex items-center gap-1.5 font-semibold text-[13.5px]">
								View car
								<Icon name="arrow" size={15} />
							</span>
						</span>
					</Link>
				</div>
			</div>
			<SearchPanel />
		</section>
	);
}
