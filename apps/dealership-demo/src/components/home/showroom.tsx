"use client";

import Link from "next/link";
import { type MouseEvent, useCallback, useMemo, useState } from "react";

import { ArrowBadge, buttonClass, Chip } from "@/components/ui";
import { VehicleCard } from "@/components/vehicle-card";
import { BODY_LABELS, BODY_TYPES, countBy } from "@/lib/stock";
import { type BodyType, vehicles } from "@/lib/vehicles";

const HOME_GRID_SIZE = 6;
const MOBILE_VISIBLE = 3;

type Tab = "all" | BodyType;

const isTab = (value: string | undefined): value is Tab =>
	value === "all" || BODY_TYPES.includes(value as BodyType);

export function Showroom() {
	const [tab, setTab] = useState<Tab>("all");
	const counts = useMemo(
		() => countBy(vehicles, (vehicle) => vehicle.body),
		[]
	);
	const tabs = useMemo(
		() =>
			BODY_TYPES.filter((body) => (counts[body] ?? 0) > 0).map((body) => ({
				count: counts[body] ?? 0,
				label: BODY_LABELS[body].split(" ")[0] ?? body,
				value: body as Tab,
			})),
		[counts]
	);

	const shown = useMemo(
		() =>
			[...vehicles]
				.filter((vehicle) => tab === "all" || vehicle.body === tab)
				.sort((a, b) => a.arrivedDaysAgo - b.arrivedDaysAgo)
				.slice(0, HOME_GRID_SIZE),
		[tab]
	);

	const onTab = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		const value = event.currentTarget.dataset.tab;
		if (isTab(value)) {
			setTab(value);
		}
	}, []);

	return (
		<section
			aria-labelledby="showroom-heading"
			className="container-page pt-14 pb-14 lg:pt-[104px] lg:pb-[104px]"
		>
			<div className="flex items-end justify-between gap-4">
				<div className="flex flex-col gap-3">
					<p className="eyebrow">In stock</p>
					<h2
						className="font-semibold text-[28px] leading-[1.05] tracking-[-0.03em] sm:text-[36px] lg:text-[44px]"
						id="showroom-heading"
					>
						In the showroom now
					</h2>
				</div>
				<Link
					className={buttonClass({ className: "pr-1.5 max-md:hidden" })}
					href="/stock"
				>
					View all {vehicles.length} cars
					<ArrowBadge />
				</Link>
			</div>

			<div
				aria-label="Filter by body type"
				className="scrollbar-none -mx-5 mt-6 flex gap-1.5 overflow-x-auto px-5 md:mx-0 md:px-0"
				role="toolbar"
			>
				<Chip
					active={tab === "all"}
					count={vehicles.length}
					data-tab="all"
					onClick={onTab}
				>
					All
				</Chip>
				{tabs.map((item) => (
					<Chip
						active={tab === item.value}
						count={item.count}
						data-tab={item.value}
						key={item.value}
						onClick={onTab}
					>
						{item.label}
					</Chip>
				))}
			</div>

			<ul className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
				{shown.map((vehicle, index) => (
					<li
						className={index >= MOBILE_VISIBLE ? "max-sm:hidden" : undefined}
						key={vehicle.id}
					>
						<VehicleCard index={index} vehicle={vehicle} />
					</li>
				))}
			</ul>

			<Link
				className={buttonClass({
					className: "mt-4 w-full md:hidden",
					size: "lg",
					variant: "outline",
				})}
				href="/stock"
			>
				View all {vehicles.length} cars
			</Link>
		</section>
	);
}
