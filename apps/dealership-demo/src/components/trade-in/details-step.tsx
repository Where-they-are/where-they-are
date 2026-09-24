"use client";

import {
	type ChangeEvent,
	type FormEvent,
	type ReactNode,
	useCallback,
	useId,
	useState,
} from "react";

import {
	buttonClass,
	FieldError,
	FieldHint,
	Input,
	Label,
	Select,
} from "@/components/ui";
import {
	TRADE_IN_CONDITIONS,
	TRADE_IN_MAKES,
	TRADE_IN_YEARS,
	type TradeInDetails,
	type TradeInField,
	validateTradeIn,
} from "@/lib/trade-in";
import { hasErrors } from "@/lib/validation";

/** Step 1 of the sell or trade-in form: the car and how to reach you. */
export function TradeInDetailsStep({
	footerNote,
	initial,
	onComplete,
	submitLabel = "Continue",
}: {
	footerNote?: ReactNode;
	initial: TradeInDetails;
	onComplete: (details: TradeInDetails) => void;
	submitLabel?: string;
}) {
	const id = useId();
	const [details, setDetails] = useState(initial);
	const [submitted, setSubmitted] = useState(false);
	const errors = submitted ? validateTradeIn(details) : {};

	const onField = useCallback(
		(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const field = event.target.name as TradeInField;
			setDetails((current) => ({ ...current, [field]: event.target.value }));
		},
		[]
	);

	const onSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setSubmitted(true);
			const found = validateTradeIn(details);
			if (hasErrors(found)) {
				const [first] = Object.keys(found);
				event.currentTarget
					.querySelector<HTMLElement>(`[name="${first}"]`)
					?.focus();
				return;
			}
			onComplete(details);
		},
		[details, onComplete]
	);

	const field = (name: TradeInField) => ({
		"aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
		id: `${id}-${name}`,
		invalid: Boolean(errors[name]),
		name,
		onChange: onField,
		value: details[name],
	});

	const error = (name: TradeInField) =>
		errors[name] ? (
			<FieldError id={`${id}-${name}-error`}>{errors[name]}</FieldError>
		) : null;

	return (
		<form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
			<div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4">
				<div>
					<Label htmlFor={`${id}-make`} required>
						Make
					</Label>
					<Select {...field("make")}>
						<option value="">Choose make</option>
						{TRADE_IN_MAKES.map((make) => (
							<option key={make} value={make}>
								{make}
							</option>
						))}
					</Select>
					{error("make")}
				</div>
				<div>
					<Label htmlFor={`${id}-model`} required>
						Model
					</Label>
					<Input
						{...field("model")}
						autoComplete="off"
						placeholder="Fortuner 2.8 GD-6"
					/>
					{error("model")}
				</div>
				<div>
					<Label htmlFor={`${id}-year`} required>
						Year
					</Label>
					<Select {...field("year")}>
						<option value="">Choose year</option>
						{TRADE_IN_YEARS.map((year) => (
							<option key={year} value={year}>
								{year}
							</option>
						))}
					</Select>
					{error("year")}
				</div>
				<div>
					<Label htmlFor={`${id}-mileage`} required>
						Mileage
					</Label>
					<Input
						{...field("mileage")}
						inputMode="numeric"
						placeholder="96,000 km"
					/>
					{error("mileage")}
				</div>
			</div>

			<fieldset
				aria-describedby={
					errors.condition ? `${id}-condition-error` : undefined
				}
			>
				<legend className="mb-2 font-semibold text-[13.5px]">
					Condition<span className="ml-0.5 text-danger">*</span>
				</legend>
				<div className="flex flex-wrap gap-2">
					{TRADE_IN_CONDITIONS.map((condition) => (
						<label className="cursor-pointer" key={condition}>
							<input
								checked={details.condition === condition}
								className="peer sr-only"
								name="condition"
								onChange={onField}
								type="radio"
								value={condition}
							/>
							<span className="inline-flex h-10 items-center rounded-full border border-line-strong bg-white px-4 font-semibold text-[14px] transition-colors hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
								{condition}
							</span>
						</label>
					))}
				</div>
				{error("condition")}
			</fieldset>

			<div>
				<Label htmlFor={`${id}-whatsapp`} required>
					WhatsApp number
				</Label>
				<Input
					{...field("whatsapp")}
					autoComplete="tel"
					inputMode="tel"
					placeholder="+263 77 123 4567"
					type="tel"
				/>
				{error("whatsapp") ?? (
					<FieldHint>We'll only use this to send your valuation.</FieldHint>
				)}
			</div>

			<div className="flex items-center justify-between gap-4 border-line border-t pt-5">
				<p className="hidden text-[13.5px] text-muted sm:block">{footerNote}</p>
				<button
					className={buttonClass({ className: "max-sm:w-full", size: "lg" })}
					type="submit"
				>
					{submitLabel}
				</button>
			</div>
		</form>
	);
}
