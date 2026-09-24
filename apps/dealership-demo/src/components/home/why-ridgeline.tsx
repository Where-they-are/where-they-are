import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/components/ui";

const reasons: {
	body: string;
	href: Route;
	icon: IconName;
	image: string;
	imageAlt: string;
	title: string;
}[] = [
	{
		body: "Applications with CABS, Stanbic and CBZ, done at our desk.",
		href: "/finance",
		icon: "card",
		image: "/cars/mercedes-interior.webp",
		imageAlt: "Dashboard of a modern car",
		title: "Finance",
	},
	{
		body: "A written valuation of your car in 30 minutes.",
		href: "/sell",
		icon: "swap",
		image: "/cars/collage-sedan-pickup.webp",
		imageAlt: "A red coupé and a black double-cab bakkie",
		title: "Trade-in",
	},
	{
		body: "Our own workshop, open six days a week.",
		href: "/service",
		icon: "wrench",
		image: "/cars/ranger-interior.webp",
		imageAlt: "Cabin of a double-cab bakkie",
		title: "Service centre",
	},
	{
		body: "Six months on every pre-owned car we sell.",
		href: "/contact?topic=stock" as Route,
		icon: "shield",
		image: "/cars/land-cruiser-hero.webp",
		imageAlt: "White Land Cruiser parked outdoors",
		title: "Warranty",
	},
];

export function WhyRidgeline() {
	return (
		<section
			aria-labelledby="why-heading"
			className="mx-3 scroll-mt-6 rounded-[26px] bg-ink px-5 py-10 text-white sm:px-8 lg:px-12 lg:py-[72px]"
			id="why"
		>
			<div className="mx-auto max-w-[88rem]">
				<div className="grid gap-5 lg:grid-cols-[1fr_2.4fr] lg:gap-10">
					<p className="font-mono text-[12px] text-accent uppercase tracking-[0.08em]">
						/ Why Ridgeline
					</p>
					<h2
						className="font-semibold text-[26px] leading-[1.15] tracking-[-0.025em] sm:text-[32px] lg:text-[40px] lg:leading-[1.12]"
						id="why-heading"
					>
						<span className="lg:hidden">
							Inspected, priced up front and backed by our own workshop.{" "}
						</span>
						<span className="hidden lg:inline">
							Every car is inspected, priced up front and backed by our own
							workshop.{" "}
						</span>
						<span className="text-subtle">
							Finance, trade-ins and servicing
							<span className="hidden lg:inline">
								{" "}
								happen under one roof in Msasa, so you deal with one team from
								test drive to first service.
							</span>
							<span className="lg:hidden"> under one roof.</span>
						</span>
					</h2>
				</div>

				<ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-2.5">
					{reasons.map((reason, index) => (
						<li key={reason.title}>
							<Link
								className="group flex h-full gap-4 overflow-hidden rounded-[18px] bg-ink-2 p-4 shadow-[inset_0_0_0_1px_var(--color-ink-3)] transition-colors hover:bg-ink-3 lg:flex-col lg:gap-0 lg:p-0"
								href={reason.href}
							>
								<span className="relative hidden h-[150px] overflow-hidden lg:block">
									<Image
										alt={reason.imageAlt}
										className="object-cover transition-transform duration-500 group-hover:scale-105"
										fill
										sizes="(min-width: 1024px) 22vw, 0px"
										src={reason.image}
									/>
								</span>
								<span className="flex flex-1 gap-4 lg:flex-col lg:gap-3 lg:p-4 lg:pb-5">
									<span
										className={cn(
											"grid size-10 shrink-0 place-items-center rounded-[10px] lg:size-9",
											index === 0 ? "bg-accent text-ink" : "bg-ink-3 text-white"
										)}
									>
										<Icon name={reason.icon} size={17} />
									</span>
									<span className="flex flex-col gap-1.5">
										<span className="font-semibold text-[17px] lg:text-[19px]">
											{reason.title}
										</span>
										<span className="text-[14px] text-faint leading-normal">
											{reason.body}
										</span>
										<span className="mt-2 hidden items-center gap-1.5 font-semibold text-[13.5px] lg:flex">
											Learn more
											<Icon
												className="transition-transform group-hover:translate-x-0.5"
												name="arrow"
												size={14}
											/>
										</span>
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
