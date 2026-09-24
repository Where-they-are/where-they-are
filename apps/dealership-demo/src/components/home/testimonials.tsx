"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { Icon } from "@/components/icons";
import { vehicles } from "@/lib/vehicles";

/**
 * Reviews for the fictional Ridgeline Motors. They are written for this demo
 * and labelled as samples on the page.
 */
const sampleReviews = [
	{
		detail: "Bought a 2022 Hilux, June 2026",
		initials: "TM",
		name: "Tawanda M.",
		quote:
			"They valued my old Fortuner on WhatsApp before I drove in, sorted the finance at their desk, and I left with the Hilux the same afternoon.",
	},
	{
		detail: "Bought a 2015 Honda Fit, May 2026",
		initials: "RC",
		name: "Rudo C.",
		quote:
			"The price on the website was the price at the desk. They sent a walkaround video on WhatsApp before I came in from Chitungwiza.",
	},
	{
		detail: "Serviced a 2018 Fortuner, August 2026",
		initials: "FN",
		name: "Farai N.",
		quote:
			"I dropped the car at seven, they called before doing anything extra, and it was ready when I finished work.",
	},
] as const;

const stripPhotos = [
	{ alt: "Toyota HiAce van", src: "/cars/hiace-van.webp" },
	{
		alt: "Orange pickups on a farm road",
		src: "/cars/orange-trucks-landscape.webp",
	},
	{ alt: "Orange Toyota SUVs on gravel", src: "/cars/orange-suvs-banner.webp" },
	{ alt: "Blue Honda Fit", src: "/cars/honda-fit-blue.webp" },
];

export function Testimonials() {
	const [index, setIndex] = useState(0);
	const count = sampleReviews.length;
	const review = sampleReviews[index] ?? sampleReviews[0];
	const previous = useCallback(
		() => setIndex((value) => (value - 1 + count) % count),
		[count]
	);
	const next = useCallback(
		() => setIndex((value) => (value + 1) % count),
		[count]
	);
	const moreInStock = Math.max(0, vehicles.length - stripPhotos.length);

	const person = (
		<div className="flex items-center gap-3.5">
			<span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-semibold text-[16px] text-white">
				{review.initials}
			</span>
			<span className="flex flex-col">
				<span className="font-semibold text-[15px]">{review.name}</span>
				<span className="text-[13.5px] text-muted">{review.detail}</span>
			</span>
		</div>
	);

	const controls = (
		<div className="flex items-center gap-3">
			<button
				aria-label="Previous review"
				className="grid size-10 cursor-pointer place-items-center rounded-full border border-line-strong bg-white hover:border-ink"
				onClick={previous}
				type="button"
			>
				<Icon name="chevronLeft" size={15} />
			</button>
			<button
				aria-label="Next review"
				className="grid size-10 cursor-pointer place-items-center rounded-full bg-ink text-white hover:bg-ink-3"
				onClick={next}
				type="button"
			>
				<Icon name="chevronRight" size={15} />
			</button>
			<span className="whitespace-nowrap font-mono text-[12.5px] text-muted">
				{index + 1} / {count}
			</span>
		</div>
	);

	return (
		<section
			aria-labelledby="reviews-heading"
			aria-roledescription="carousel"
			className="mx-3 rounded-[26px] bg-soft px-5 py-8 sm:px-8 lg:px-12 lg:py-[72px]"
		>
			<div className="mx-auto grid max-w-[88rem] gap-6 lg:grid-cols-[1fr_2.2fr] lg:gap-10">
				<div className="flex flex-col justify-between gap-6">
					<div className="flex flex-col gap-5">
						<div className="flex flex-wrap items-center gap-2.5">
							<h2 className="eyebrow" id="reviews-heading">
								From our customers
							</h2>
							<span className="rounded-full bg-white px-2 py-0.5 font-medium text-[11.5px] text-muted shadow-[0_0_0_1px_var(--color-line)]">
								Sample reviews
							</span>
						</div>
						<div className="hidden lg:block">{person}</div>
					</div>
					<div className="hidden lg:block">{controls}</div>
				</div>

				<div className="flex flex-col gap-6">
					<blockquote
						aria-live="polite"
						className="font-medium text-[22px] leading-[1.3] tracking-[-0.015em] sm:text-[26px] lg:text-[32px] lg:leading-[1.25]"
						key={review.name}
					>
						"{review.quote}"
					</blockquote>

					<div className="flex items-center justify-between gap-4 border-line border-t pt-5 lg:hidden">
						{person}
						<div className="flex shrink-0 items-center gap-2">
							<button
								aria-label="Previous review"
								className="grid size-9 cursor-pointer place-items-center rounded-full border border-line-strong bg-white"
								onClick={previous}
								type="button"
							>
								<Icon name="chevronLeft" size={14} />
							</button>
							<span className="whitespace-nowrap font-mono text-[12.5px] text-muted">
								{index + 1} / {count}
							</span>
							<button
								aria-label="Next review"
								className="grid size-9 cursor-pointer place-items-center rounded-full bg-ink text-white"
								onClick={next}
								type="button"
							>
								<Icon name="chevronRight" size={14} />
							</button>
						</div>
					</div>

					<ul className="hidden gap-2.5 lg:flex">
						{stripPhotos.map((photo) => (
							<li
								className="relative h-[62px] w-[88px] overflow-hidden rounded-[10px]"
								key={photo.src}
							>
								<Image
									alt={photo.alt}
									className="object-cover"
									fill
									sizes="240px"
									src={photo.src}
								/>
							</li>
						))}
						<li>
							<Link
								aria-label={`${moreInStock} more cars in stock`}
								className="grid h-[62px] w-[88px] place-items-center rounded-[10px] bg-line font-semibold text-[15px] transition-colors hover:bg-line-strong"
								href="/stock"
							>
								+{moreInStock}
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}
