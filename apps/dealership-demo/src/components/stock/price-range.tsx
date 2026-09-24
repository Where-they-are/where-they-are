"use client";

import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useId,
	useState,
} from "react";

import { Input } from "@/components/ui";
import { formatNumber, parseAmount } from "@/lib/format";

export const PRICE_FLOOR = 5000;
export const PRICE_CEILING = 80_000;
const PRICE_STEP = 1000;

const clamp = (value: number) =>
	Math.min(PRICE_CEILING, Math.max(PRICE_FLOOR, value));

/** Min/max price slider with matching text inputs. Undefined means "no limit". */
export function PriceRange({
	max,
	min,
	onChange,
}: {
	max?: number;
	min?: number;
	onChange: (range: { max?: number; min?: number }) => void;
}) {
	const id = useId();
	const low = clamp(min ?? PRICE_FLOOR);
	const high = clamp(max ?? PRICE_CEILING);
	const [lowText, setLowText] = useState(formatNumber(low));
	const [highText, setHighText] = useState(formatNumber(high));

	useEffect(() => {
		setLowText(formatNumber(low));
		setHighText(formatNumber(high));
	}, [low, high]);

	const emit = useCallback(
		(nextLow: number, nextHigh: number) => {
			const [a, b] =
				nextLow <= nextHigh ? [nextLow, nextHigh] : [nextHigh, nextLow];
			onChange({
				max: b >= PRICE_CEILING ? undefined : b,
				min: a <= PRICE_FLOOR ? undefined : a,
			});
		},
		[onChange]
	);

	const onLowSlider = useCallback(
		(event: ChangeEvent<HTMLInputElement>) =>
			emit(Math.min(Number(event.target.value), high - PRICE_STEP), high),
		[emit, high]
	);
	const onHighSlider = useCallback(
		(event: ChangeEvent<HTMLInputElement>) =>
			emit(low, Math.max(Number(event.target.value), low + PRICE_STEP)),
		[emit, low]
	);
	const onLowText = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => setLowText(event.target.value),
		[]
	);
	const onHighText = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => setHighText(event.target.value),
		[]
	);
	const commitText = useCallback(() => {
		emit(
			clamp(parseAmount(lowText) ?? PRICE_FLOOR),
			clamp(parseAmount(highText) ?? PRICE_CEILING)
		);
	}, [emit, highText, lowText]);

	const span = PRICE_CEILING - PRICE_FLOOR;
	const left = ((low - PRICE_FLOOR) / span) * 100;
	const right = 100 - ((high - PRICE_FLOOR) / span) * 100;

	return (
		<div className="flex flex-col gap-3">
			<div className="relative h-7">
				<div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
				<div
					className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink"
					style={{ left: `${left}%`, right: `${right}%` }}
				/>
				<input
					aria-label="Minimum price"
					className="dual-range-input"
					max={PRICE_CEILING}
					min={PRICE_FLOOR}
					onChange={onLowSlider}
					step={PRICE_STEP}
					type="range"
					value={low}
				/>
				<input
					aria-label="Maximum price"
					className="dual-range-input"
					max={PRICE_CEILING}
					min={PRICE_FLOOR}
					onChange={onHighSlider}
					step={PRICE_STEP}
					type="range"
					value={high}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<label className="sr-only" htmlFor={`${id}-min`}>
					Minimum price in US dollars
				</label>
				<Input
					id={`${id}-min`}
					inputMode="numeric"
					onBlur={commitText}
					onChange={onLowText}
					prefix="$"
					size="sm"
					value={lowText}
				/>
				<label className="sr-only" htmlFor={`${id}-max`}>
					Maximum price in US dollars
				</label>
				<Input
					id={`${id}-max`}
					inputMode="numeric"
					onBlur={commitText}
					onChange={onHighText}
					prefix="$"
					size="sm"
					value={highText}
				/>
			</div>
		</div>
	);
}
