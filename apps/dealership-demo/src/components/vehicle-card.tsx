import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { Icon, type IconName } from "@/components/icons";
import { SaveHeart } from "@/components/save-button";
import { cn } from "@/components/ui";
import { formatKm, formatPrice } from "@/lib/format";
import { type Vehicle, vehicleTitle } from "@/lib/vehicles";

const TINTS = ["bg-[#eef1f4]", "bg-[#f1efea]", "bg-[#eef1ee]"] as const;

export const vehicleHref = (vehicle: Pick<Vehicle, "id">): Route =>
	`/stock/${vehicle.id}` as Route;

export function VehicleBadge({ vehicle }: { vehicle: Vehicle }) {
	const label = vehicle.justArrived ? "Just arrived" : vehicle.condition;
	return (
		<span
			className={cn(
				"inline-flex h-7 items-center rounded-full px-[11px] font-semibold text-[12.5px]",
				vehicle.justArrived ? "bg-accent text-ink" : "bg-white text-ink"
			)}
		>
			{label}
		</span>
	);
}

export function VehicleSpecs({
	className,
	vehicle,
}: {
	className?: string;
	vehicle: Vehicle;
}) {
	const specs: { icon: IconName; label: string; value: string }[] = [
		{ icon: "gauge", label: "Mileage", value: formatKm(vehicle.mileageKm) },
		{ icon: "calendar", label: "Year", value: String(vehicle.year) },
		{ icon: "fuel", label: "Fuel", value: vehicle.fuel },
		{ icon: "gear", label: "Gearbox", value: vehicle.gearbox },
	];
	return (
		<dl
			className={cn(
				"grid grid-cols-[repeat(4,auto)] justify-between gap-x-2 font-mono text-[12px] text-body xs:text-[12.5px]",
				className
			)}
		>
			{specs.map((spec) => (
				<div
					className="flex items-center gap-1.5 whitespace-nowrap"
					key={spec.label}
				>
					<dt className="text-muted">
						<Icon name={spec.icon} size={15} />
						<span className="sr-only">{spec.label}</span>
					</dt>
					<dd>{spec.value}</dd>
				</div>
			))}
		</dl>
	);
}

export function VehicleCard({
	index = 0,
	layout = "grid",
	priority = false,
	vehicle,
}: {
	index?: number;
	layout?: "grid" | "list";
	priority?: boolean;
	vehicle: Vehicle;
}) {
	const title = vehicleTitle(vehicle);
	const [image] = vehicle.images;
	const isList = layout === "list";
	return (
		<article
			className={cn(
				"group relative flex rounded-[20px] p-2.5 transition-shadow hover:shadow-card",
				TINTS[index % TINTS.length],
				isList
					? "flex-col gap-3.5 sm:flex-row sm:items-stretch"
					: "flex-col gap-3.5"
			)}
		>
			<div
				className={cn(
					"relative overflow-hidden rounded-[14px] bg-[#e2e4e1]",
					isList
						? "aspect-[16/10] sm:aspect-auto sm:min-h-48 sm:w-[42%] sm:shrink-0"
						: "aspect-[16/10]"
				)}
			>
				{image ? (
					<Image
						alt={image.alt}
						className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
						fill
						priority={priority}
						sizes={
							isList
								? "(min-width: 640px) 40vw, 100vw"
								: "(min-width: 1280px) 28vw, (min-width: 640px) 45vw, 100vw"
						}
						src={image.src}
					/>
				) : null}
				<span className="pointer-events-none absolute top-3 left-3">
					<VehicleBadge vehicle={vehicle} />
				</span>
				<SaveHeart
					className="absolute top-3 right-3 z-10"
					vehicleId={vehicle.id}
					vehicleName={title}
				/>
			</div>
			<div
				className={cn(
					"flex flex-1 flex-col gap-3.5",
					isList && "sm:justify-between sm:py-2"
				)}
			>
				<div className="flex items-start justify-between gap-3 px-2">
					<h3 className="font-semibold text-[17.5px] leading-tight tracking-[-0.01em]">
						<Link
							className="after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-accent"
							href={vehicleHref(vehicle)}
						>
							{title}
						</Link>
					</h3>
					<p className="whitespace-nowrap font-bold text-[17.5px]">
						{formatPrice(vehicle.price)}
					</p>
				</div>
				{isList ? (
					<div className="hidden flex-col gap-3 px-2 sm:flex">
						<p className="text-[14px] text-muted">
							{vehicle.engine} · {vehicle.gearboxDetail} · {vehicle.drive}
						</p>
						<ul className="flex flex-wrap gap-2">
							{vehicle.highlights.map((highlight) => (
								<li
									className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-[12.5px]"
									key={highlight}
								>
									<Icon className="text-success" name="check" size={13} />
									{highlight}
								</li>
							))}
						</ul>
					</div>
				) : null}
				<VehicleSpecs
					className="mx-2 mb-1.5 border-ink/10 border-t pt-3"
					vehicle={vehicle}
				/>
			</div>
		</article>
	);
}
