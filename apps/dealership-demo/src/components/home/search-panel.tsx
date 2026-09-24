"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
	type ChangeEvent,
	type FormEvent,
	type MouseEvent,
	useCallback,
	useId,
	useMemo,
	useState,
} from "react";

import { Icon } from "@/components/icons";
import { Chip, cn, Label, Select } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import {
	applyFilters,
	emptyFilters,
	filtersToQuery,
	PRICE_OPTIONS,
	type StockFilters,
	YEAR_OPTIONS,
} from "@/lib/stock";
import { vehicles } from "@/lib/vehicles";

type Segment = "all" | "new" | "pre-owned" | "bakkies";

const segments: { hideOnMobile?: boolean; label: string; value: Segment }[] = [
	{ label: "All", value: "all" },
	{ label: "New", value: "new" },
	{ label: "Pre-owned", value: "pre-owned" },
	{ hideOnMobile: true, label: "Bakkies", value: "bakkies" },
];

const segmentFilters: Record<Segment, Partial<StockFilters>> = {
	all: {},
	bakkies: { body: ["Bakkie"] },
	new: { condition: "New" },
	"pre-owned": { condition: "Pre-owned" },
};

const isSegment = (value: string | undefined): value is Segment =>
	segments.some((segment) => segment.value === value);

const makes = [...new Set(vehicles.map((vehicle) => vehicle.make))].sort();

export function SearchPanel() {
	const router = useRouter();
	const id = useId();
	const [segment, setSegment] = useState<Segment>("all");
	const [make, setMake] = useState("");
	const [model, setModel] = useState("");
	const [minYear, setMinYear] = useState("");
	const [maxPrice, setMaxPrice] = useState("");

	const filters = useMemo<StockFilters>(
		() => ({
			...emptyFilters,
			...segmentFilters[segment],
			make: make || undefined,
			maxPrice: maxPrice ? Number(maxPrice) : undefined,
			minYear: minYear ? Number(minYear) : undefined,
			model: model || undefined,
		}),
		[segment, make, model, minYear, maxPrice]
	);

	const matches = useMemo(
		() => applyFilters(vehicles, filters).length,
		[filters]
	);

	const segmentCounts = useMemo(
		() =>
			Object.fromEntries(
				segments.map((item) => [
					item.value,
					applyFilters(vehicles, {
						...emptyFilters,
						...segmentFilters[item.value],
					}).length,
				])
			) as Record<Segment, number>,
		[]
	);

	const models = useMemo(
		() =>
			[
				...new Set(
					vehicles
						.filter((vehicle) => !make || vehicle.make === make)
						.map((vehicle) => vehicle.model)
				),
			].sort(),
		[make]
	);

	const onSegment = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		const value = event.currentTarget.dataset.segment;
		if (isSegment(value)) {
			setSegment(value);
		}
	}, []);

	const onMake = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		setMake(event.target.value);
		setModel("");
	}, []);
	const onModel = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => setModel(event.target.value),
		[]
	);
	const onYear = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => setMinYear(event.target.value),
		[]
	);
	const onPrice = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => setMaxPrice(event.target.value),
		[]
	);

	const onSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const query = filtersToQuery(filters);
			router.push((query ? `/stock?${query}` : "/stock") as Route);
		},
		[filters, router]
	);

	return (
		<form
			aria-label="Search stock"
			className="relative z-10 mx-4 -mt-16 flex flex-col gap-4 rounded-[22px] bg-white p-4 shadow-[0_0_0_1px_var(--color-line),0_30px_60px_-30px_rgba(14,15,17,0.35)] sm:mx-8 sm:p-5 lg:mx-auto lg:-mt-[72px] lg:max-w-[1180px] lg:gap-[18px] lg:px-6 lg:py-[22px]"
			onSubmit={onSubmit}
		>
			<div className="flex items-center justify-between gap-4">
				<div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
					{segments.map((item) => (
						<Chip
							active={segment === item.value}
							className={cn(item.hideOnMobile && "max-sm:hidden")}
							count={segmentCounts[item.value]}
							data-segment={item.value}
							key={item.value}
							onClick={onSegment}
						>
							{item.label}
						</Chip>
					))}
				</div>
				<p className="hidden items-center gap-2 text-[13.5px] text-muted md:flex">
					<span className="size-[7px] rounded-full bg-success" />
					Stock updated today
				</p>
			</div>

			<div className="grid grid-cols-2 items-end gap-3 lg:grid-cols-[repeat(4,1fr)_170px]">
				<div>
					<Label htmlFor={`${id}-make`}>Make</Label>
					<Select id={`${id}-make`} onChange={onMake} value={make}>
						<option value="">Any make</option>
						{makes.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</Select>
				</div>
				<div className="hidden lg:block">
					<Label htmlFor={`${id}-model`}>Model</Label>
					<Select id={`${id}-model`} onChange={onModel} value={model}>
						<option value="">Any model</option>
						{models.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</Select>
				</div>
				<div className="hidden lg:block">
					<Label htmlFor={`${id}-year`}>Year</Label>
					<Select id={`${id}-year`} onChange={onYear} value={minYear}>
						<option value="">Any year</option>
						{YEAR_OPTIONS.map((year) => (
							<option key={year} value={year}>
								{year} or newer
							</option>
						))}
					</Select>
				</div>
				<div>
					<Label htmlFor={`${id}-price`}>Max price</Label>
					<Select id={`${id}-price`} onChange={onPrice} value={maxPrice}>
						<option value="">Any price</option>
						{PRICE_OPTIONS.map((price) => (
							<option key={price} value={price}>
								{formatPrice(price)}
							</option>
						))}
					</Select>
				</div>
				<button
					className="col-span-2 inline-flex h-[52px] cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-ink px-5 font-semibold text-[15px] text-white transition-colors hover:bg-ink-3 lg:col-span-1 lg:h-12 lg:rounded-xl"
					type="submit"
				>
					<Icon name="search" size={17} />
					<span aria-live="polite">
						Search {matches} {matches === 1 ? "car" : "cars"}
					</span>
				</button>
			</div>
		</form>
	);
}
