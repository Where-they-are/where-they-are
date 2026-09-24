"use client";

import Image from "next/image";
import {
	type MouseEvent,
	type PointerEvent,
	type ReactNode,
	useCallback,
	useRef,
	useState,
} from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/components/ui";
import type { VehicleImage } from "@/lib/vehicles";

const SWIPE_THRESHOLD_PX = 40;

const callouts = [
	{
		className: "top-11 left-6 xl:left-7",
		label: "Factory tyres, 80% tread",
		line: "left-full top-[48px] w-20",
		src: "/cars/fortuner-silver.webp",
	},
	{
		className: "top-7 right-6 xl:right-7",
		label: "Leather, third-row seats",
		line: "right-full top-[48px] w-24",
		src: "/cars/ranger-interior.webp",
	},
	{
		className: "right-11 bottom-7",
		label: "Tow bar and roof rails",
		line: "right-full top-[48px] w-16",
		src: "/cars/fortuner-silver.webp",
	},
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** Main photo stage, callouts, carousel controls and thumbnails for the featured car. */
export function FeaturedGallery({
	aside,
	details,
	images,
	mobileExtras,
	watermark,
}: {
	aside: ReactNode;
	details: ReactNode;
	images: VehicleImage[];
	mobileExtras?: ReactNode;
	watermark: string;
}) {
	const [index, setIndex] = useState(0);
	const pointerStart = useRef<number | null>(null);
	const count = images.length;
	const current = images[index] ?? images[0];

	const go = useCallback(
		(delta: number) => setIndex((value) => (value + delta + count) % count),
		[count]
	);
	const previous = useCallback(() => go(-1), [go]);
	const next = useCallback(() => go(1), [go]);
	const onThumb = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		setIndex(Number(event.currentTarget.dataset.index ?? 0));
	}, []);
	const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
		pointerStart.current = event.clientX;
	}, []);
	const onPointerCancel = useCallback(() => {
		pointerStart.current = null;
	}, []);
	const onPointerUp = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			if (pointerStart.current === null) {
				return;
			}
			const distance = event.clientX - pointerStart.current;
			pointerStart.current = null;
			if (Math.abs(distance) > SWIPE_THRESHOLD_PX) {
				go(distance < 0 ? 1 : -1);
			}
		},
		[go]
	);

	return (
		<div className="flex flex-col gap-5 lg:gap-6">
			<div className="relative overflow-hidden rounded-3xl bg-white px-4 pt-6 pb-5 sm:px-8 lg:min-h-[400px] lg:px-0 lg:pt-10">
				<p
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 top-4 select-none text-center font-bold text-[#ecece8] text-[clamp(72px,14vw,190px)] uppercase leading-[0.8] tracking-[-0.05em] lg:top-8"
				>
					{watermark}
				</p>
				<figure
					aria-label={`Photo ${index + 1} of ${count}`}
					className="relative mx-auto aspect-[16/9] w-full touch-pan-y overflow-hidden rounded-xl sm:max-w-[580px] lg:aspect-[2.3/1]"
					onPointerCancel={onPointerCancel}
					onPointerDown={onPointerDown}
					onPointerUp={onPointerUp}
				>
					{current ? (
						<Image
							alt={current.alt}
							className="select-none object-cover"
							draggable={false}
							fill
							key={current.src}
							sizes="(min-width: 1024px) 580px, 90vw"
							src={current.src}
						/>
					) : null}
					<span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-ink/80 p-1 font-mono text-[12px] text-white lg:hidden">
						<button
							aria-label="Previous photo"
							className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-white/15"
							onClick={previous}
							type="button"
						>
							<Icon name="chevronLeft" size={13} />
						</button>
						{index + 1} / {count}
						<button
							aria-label="Next photo"
							className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-white/15"
							onClick={next}
							type="button"
						>
							<Icon name="chevronRight" size={13} />
						</button>
					</span>
				</figure>

				{callouts.map((callout) => (
					<figure
						className={cn(
							"absolute hidden w-[156px] flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_0_0_1px_var(--color-line),0_20px_40px_-20px_rgba(14,15,17,0.35)] lg:flex",
							callout.className
						)}
						key={callout.label}
					>
						<span
							aria-hidden="true"
							className={cn("absolute h-px bg-line-strong", callout.line)}
						/>
						<span className="relative block h-[62px] overflow-hidden rounded-[10px]">
							<Image
								alt=""
								className="object-cover"
								fill
								sizes="140px"
								src={callout.src}
							/>
						</span>
						<figcaption className="px-1 pb-0.5 font-semibold text-[12px] leading-tight">
							{callout.label}
						</figcaption>
					</figure>
				))}

				<div className="mt-4 hidden items-center justify-center gap-3 lg:flex">
					<button
						aria-label="Previous photo"
						className="grid size-8 cursor-pointer place-items-center rounded-full border border-line-strong bg-white hover:border-ink"
						onClick={previous}
						type="button"
					>
						<Icon name="chevronLeft" size={14} />
					</button>
					<span className="font-mono text-[12.5px] text-muted">
						{pad(index + 1)} / {pad(count)} photos
					</span>
					<button
						aria-label="Next photo"
						className="grid size-8 cursor-pointer place-items-center rounded-full bg-ink text-white hover:bg-ink-3"
						onClick={next}
						type="button"
					>
						<Icon name="chevronRight" size={14} />
					</button>
				</div>
			</div>

			{mobileExtras ? <div className="lg:hidden">{mobileExtras}</div> : null}

			<div className="grid gap-5 lg:grid-cols-[310px_1fr] lg:gap-9">
				<div className="order-2 flex flex-col gap-5 lg:order-1">
					<div className="hidden gap-2 lg:flex">
						{images.map((image, imageIndex) => (
							<button
								aria-current={imageIndex === index}
								aria-label={`Show photo ${imageIndex + 1}: ${image.alt}`}
								className={cn(
									"relative h-[60px] w-[74px] cursor-pointer overflow-hidden rounded-[10px] outline-offset-2 transition-[outline-color]",
									imageIndex === index
										? "outline-2 outline-ink"
										: "opacity-90 outline-2 outline-transparent hover:opacity-100"
								)}
								data-index={imageIndex}
								key={image.src}
								onClick={onThumb}
								type="button"
							>
								<Image
									alt=""
									className="object-cover"
									fill
									sizes="74px"
									src={image.src}
								/>
							</button>
						))}
					</div>
					{aside}
				</div>
				<div className="order-1 lg:order-2">{details}</div>
			</div>
		</div>
	);
}
