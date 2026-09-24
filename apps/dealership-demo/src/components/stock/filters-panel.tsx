"use client";

import { type ChangeEvent, type MouseEvent, useCallback, useId } from "react";

import { Icon } from "@/components/icons";
import { PriceRange } from "@/components/stock/price-range";
import { cn, Label, Select } from "@/components/ui";
import {
	activeFilterChips,
	applyFilters,
	BODY_LABELS,
	BODY_TYPES,
	emptyFilters,
	FUELS,
	GEARBOXES,
	removeFilter,
	type StockFilters,
	YEAR_OPTIONS,
} from "@/lib/stock";
import { type BodyType, type Fuel, vehicles } from "@/lib/vehicles";

const makes = [...new Set(vehicles.map((vehicle) => vehicle.make))].sort();

/** Count of cars per facet value, ignoring the facet's own current selection. */
const facetCount = (
	filters: StockFilters,
	patch: Partial<StockFilters>
): number => applyFilters(vehicles, { ...filters, ...patch }).length;

export function ActiveFilterChips({
	filters,
	onChange,
	tone = "dark",
}: {
	filters: StockFilters;
	onChange: (next: StockFilters) => void;
	tone?: "dark" | "light";
}) {
	const chips = activeFilterChips(filters);
	const onRemove = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			const key = event.currentTarget.dataset.chip;
			if (key) {
				onChange(removeFilter(filters, key));
			}
		},
		[filters, onChange]
	);
	if (chips.length === 0) {
		return null;
	}
	return (
		<ul className="flex flex-wrap gap-1.5">
			{chips.map((chip) => (
				<li key={chip.key}>
					<button
						aria-label={`Remove filter: ${chip.label}`}
						className={cn(
							"inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full pr-2 pl-3 font-medium text-[12.5px] transition-colors",
							tone === "dark"
								? "bg-ink text-white hover:bg-ink-3"
								: "bg-soft text-ink hover:bg-line"
						)}
						data-chip={chip.key}
						onClick={onRemove}
						type="button"
					>
						{chip.label}
						<Icon name="x" size={13} />
					</button>
				</li>
			))}
		</ul>
	);
}

function CheckboxRow({
	checked,
	count,
	label,
	onChange,
	value,
}: {
	checked: boolean;
	count: number;
	label: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	value: string;
}) {
	return (
		<label className="flex cursor-pointer items-center gap-3 py-[7px] text-[14.5px]">
			<input
				checked={checked}
				className="peer sr-only"
				onChange={onChange}
				type="checkbox"
				value={value}
			/>
			<span className="grid size-[18px] place-items-center rounded-[5px] border border-line-strong bg-white text-white transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
				<Icon name="check" size={12} />
			</span>
			<span className="flex-1">{label}</span>
			<span className="font-mono text-[12px] text-subtle">{count}</span>
		</label>
	);
}

export function FiltersPanel({
	filters,
	onChange,
	showHeader = true,
}: {
	filters: StockFilters;
	onChange: (next: StockFilters) => void;
	showHeader?: boolean;
}) {
	const id = useId();

	const toggleList = useCallback(
		<K extends "body" | "fuel">(key: K, value: StockFilters[K][number]) => {
			const current = filters[key] as string[];
			const next = current.includes(value)
				? current.filter((item) => item !== value)
				: [...current, value];
			onChange({ ...filters, [key]: next });
		},
		[filters, onChange]
	);

	const onBody = useCallback(
		(event: ChangeEvent<HTMLInputElement>) =>
			toggleList("body", event.target.value as BodyType),
		[toggleList]
	);
	const onFuel = useCallback(
		(event: ChangeEvent<HTMLInputElement>) =>
			toggleList("fuel", event.target.value as Fuel),
		[toggleList]
	);
	const onSelect = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => {
			const { name, value } = event.target;
			let parsed: string | number | undefined;
			if (value) {
				parsed = name === "minYear" ? Number(value) : value;
			}
			onChange({
				...filters,
				[name]: parsed,
				...(name === "make" ? { model: undefined } : {}),
			});
		},
		[filters, onChange]
	);
	const onPrice = useCallback(
		(range: { max?: number; min?: number }) =>
			onChange({ ...filters, maxPrice: range.max, minPrice: range.min }),
		[filters, onChange]
	);
	const onClear = useCallback(
		() => onChange({ ...emptyFilters, sort: filters.sort }),
		[filters.sort, onChange]
	);

	const hasFilters = activeFilterChips(filters).length > 0;
	const makeOptions =
		filters.make && !makes.includes(filters.make)
			? [...makes, filters.make]
			: makes;
	const section = "border-line border-t pt-5";

	return (
		<div className="flex flex-col gap-5">
			{showHeader ? (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-[16px]">Filters</h2>
						{hasFilters ? (
							<button
								className="cursor-pointer font-semibold text-[13.5px] underline underline-offset-[3px] hover:text-accent"
								onClick={onClear}
								type="button"
							>
								Clear all
							</button>
						) : null}
					</div>
					<ActiveFilterChips filters={filters} onChange={onChange} />
				</div>
			) : null}

			<fieldset className={section}>
				<legend className="mb-1.5 font-semibold text-[13.5px]">
					Body type
				</legend>
				{BODY_TYPES.map((body) => (
					<CheckboxRow
						checked={filters.body.includes(body)}
						count={facetCount(filters, { body: [body] })}
						key={body}
						label={BODY_LABELS[body]}
						onChange={onBody}
						value={body}
					/>
				))}
			</fieldset>

			<fieldset className={section}>
				<legend className="mb-2.5 font-semibold text-[13.5px]">Price</legend>
				<PriceRange
					max={filters.maxPrice}
					min={filters.minPrice}
					onChange={onPrice}
				/>
			</fieldset>

			<fieldset className={section}>
				<legend className="mb-1.5 font-semibold text-[13.5px]">Fuel</legend>
				{FUELS.map((fuel) => (
					<CheckboxRow
						checked={filters.fuel.includes(fuel)}
						count={facetCount(filters, { fuel: [fuel] })}
						key={fuel}
						label={fuel}
						onChange={onFuel}
						value={fuel}
					/>
				))}
			</fieldset>

			<div className={cn(section, "flex flex-col gap-4")}>
				<div>
					<Label htmlFor={`${id}-make`}>Make</Label>
					<Select
						id={`${id}-make`}
						name="make"
						onChange={onSelect}
						value={filters.make ?? ""}
					>
						<option value="">Any make</option>
						{makeOptions.map((make) => (
							<option key={make} value={make}>
								{make}
							</option>
						))}
					</Select>
				</div>
				<div>
					<Label htmlFor={`${id}-year`}>Year</Label>
					<Select
						id={`${id}-year`}
						name="minYear"
						onChange={onSelect}
						value={filters.minYear ?? ""}
					>
						<option value="">Any year</option>
						{YEAR_OPTIONS.map((year) => (
							<option key={year} value={year}>
								{year} or newer
							</option>
						))}
					</Select>
				</div>
				<div>
					<Label htmlFor={`${id}-gearbox`}>Gearbox</Label>
					<Select
						id={`${id}-gearbox`}
						name="gearbox"
						onChange={onSelect}
						value={filters.gearbox ?? ""}
					>
						<option value="">Any</option>
						{GEARBOXES.map((gearbox) => (
							<option key={gearbox} value={gearbox}>
								{gearbox === "Auto" ? "Automatic" : "Manual"}
							</option>
						))}
					</Select>
				</div>
			</div>
		</div>
	);
}
