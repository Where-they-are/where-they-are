import Link from "next/link";

import { FeaturedGallery } from "@/components/home/featured-gallery";
import { Icon } from "@/components/icons";
import { SavePill } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { buttonClass } from "@/components/ui";
import { vehicleHref } from "@/components/vehicle-card";
import { financeFrom } from "@/lib/finance";
import { formatKm, formatPrice } from "@/lib/format";
import { demoActionLink } from "@/lib/site";
import { featuredVehicle, type Vehicle, vehicleTitle } from "@/lib/vehicles";

function HighlightChips({ vehicle }: { vehicle: Vehicle }) {
	return (
		<ul className="flex flex-wrap gap-2">
			{vehicle.highlights.map((highlight) => (
				<li
					className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 font-medium text-[13px] shadow-[0_0_0_1px_var(--color-line)]"
					key={highlight}
				>
					<Icon className="text-success" name="check" size={13} />
					{highlight}
				</li>
			))}
		</ul>
	);
}

export function FeaturedCar() {
	const vehicle = featuredVehicle;
	const title = vehicleTitle(vehicle);
	const href = vehicleHref(vehicle);
	const monthly = financeFrom(vehicle.price);
	const specs = [
		{ label: "Mileage", value: formatKm(vehicle.mileageKm) },
		{ label: "Engine", value: vehicle.engine },
		{ label: "Gearbox", value: vehicle.gearboxDetail },
		{ label: "Drive", value: vehicle.drive },
	];

	const priceCard = (
		<div className="flex flex-col gap-4 rounded-[20px] bg-white p-5 shadow-[0_0_0_1px_var(--color-line)]">
			<div className="flex items-end justify-between gap-3 lg:items-center">
				<span className="hidden text-[13.5px] text-muted lg:inline">Price</span>
				<span className="font-bold text-[28px] tracking-[-0.02em] lg:text-[30px]">
					{formatPrice(vehicle.price)}
				</span>
				<span className="text-[13.5px] text-muted lg:hidden">
					from {formatPrice(monthly)}/mo
				</span>
			</div>
			<div className="hidden border-line border-t pt-4 lg:block">
				<p className="flex justify-between text-[13.5px] text-muted">
					Finance from
					<span className="text-ink">
						<b className="font-semibold">{formatPrice(monthly)}</b>/month
					</span>
				</p>
				<p className="mt-1.5 text-[12px] text-muted">
					30% deposit, 48 months. Subject to bank approval.
				</p>
			</div>
			<div className="grid grid-cols-2 gap-2.5">
				<Link
					className={buttonClass()}
					href={`${href}#test-drive` as typeof href}
				>
					<span className="lg:hidden">Test drive</span>
					<span className="hidden lg:inline">Book a test drive</span>
				</Link>
				<a
					className={buttonClass({ variant: "outline" })}
					href={demoActionLink(`WhatsApp about the ${title}`)}
					rel="noopener"
					target="_blank"
				>
					<Icon name="chat" size={16} />
					<span className="lg:hidden">WhatsApp</span>
					<span className="hidden lg:inline">WhatsApp us</span>
				</a>
			</div>
		</div>
	);

	const details = (
		<div className="flex flex-col gap-7">
			<dl className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_var(--color-line)] lg:grid-cols-4 lg:rounded-none lg:bg-transparent lg:shadow-none">
				{specs.map((spec) => (
					<div
						className="flex flex-col gap-1 border-line p-4 max-lg:odd:border-r lg:border-l lg:py-1 lg:first:border-l-0 lg:first:pl-0 max-lg:[&:nth-child(-n+2)]:border-b"
						key={spec.label}
					>
						<dt className="text-[12.5px] text-muted">{spec.label}</dt>
						<dd className="font-semibold text-[15.5px] lg:text-[17px]">
							{spec.value}
						</dd>
					</div>
				))}
			</dl>
			<div className="hidden lg:block">
				<h3 className="font-semibold text-[18px]">Overview</h3>
				<p className="mt-3 max-w-[560px] text-[15px] text-body leading-relaxed">
					{vehicle.overview}
				</p>
				<ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-muted">
					{[
						"Inspected by our workshop",
						"6-month warranty",
						"Trade-ins welcome",
					].map((item) => (
						<li className="flex items-center gap-2" key={item}>
							<Icon name="shield" size={15} />
							{item}
						</li>
					))}
				</ul>
			</div>
		</div>
	);

	return (
		<section
			aria-labelledby="featured-heading"
			className="mx-3 rounded-[26px] bg-soft py-7 lg:py-14"
		>
			<div className="container-page flex flex-col gap-6 lg:gap-8">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="flex flex-col gap-3">
						<p className="eyebrow">
							Just arrived
							<span className="hidden lg:inline">
								{" "}
								· Stock {vehicle.stockNumber}
							</span>
						</p>
						<h2
							className="max-w-[16ch] font-semibold text-[28px] leading-[1.05] tracking-[-0.03em] sm:max-w-none sm:text-[36px] lg:text-[44px]"
							id="featured-heading"
						>
							<Link className="hover:text-accent" href={href}>
								{title}
							</Link>
						</h2>
						<div className="hidden lg:block">
							<HighlightChips vehicle={vehicle} />
						</div>
					</div>
					<div className="hidden gap-2 lg:flex">
						<ShareButton path={href} title={title} />
						<SavePill vehicleId={vehicle.id} vehicleName={title} />
					</div>
				</div>
				<FeaturedGallery
					aside={priceCard}
					details={details}
					images={vehicle.images}
					mobileExtras={<HighlightChips vehicle={vehicle} />}
					watermark="Prado"
				/>
			</div>
		</section>
	);
}
