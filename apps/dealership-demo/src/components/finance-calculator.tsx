"use client";

import {
	type ChangeEvent,
	type CSSProperties,
	type MouseEvent,
	useCallback,
	useId,
	useMemo,
	useState,
} from "react";

import { cn, Input, Label } from "@/components/ui";
import {
	DEFAULT_DEPOSIT_PERCENT,
	DEFAULT_TERM,
	estimateFinance,
	FINANCE_TERMS,
	type FinanceTerm,
	INDICATIVE_ANNUAL_RATE,
	MAX_DEPOSIT_PERCENT,
	MIN_DEPOSIT_PERCENT,
} from "@/lib/finance";
import { formatNumber, formatPrice, parseAmount } from "@/lib/format";

const DEPOSIT_STEP = 5;
const MAX_PRICE = 500_000;

const isTerm = (value: number): value is FinanceTerm =>
	FINANCE_TERMS.includes(value as FinanceTerm);

/** Interactive repayment estimate: price, deposit slider and term. */
export function FinanceCalculator({
	className,
	initialPrice = 42_000,
}: {
	className?: string;
	initialPrice?: number;
}) {
	const id = useId();
	const [priceText, setPriceText] = useState(formatNumber(initialPrice));
	const [deposit, setDeposit] = useState(DEFAULT_DEPOSIT_PERCENT);
	const [term, setTerm] = useState<FinanceTerm>(DEFAULT_TERM);

	const price = Math.min(parseAmount(priceText) ?? 0, MAX_PRICE);
	const estimate = useMemo(
		() => estimateFinance(price, deposit, term),
		[price, deposit, term]
	);

	const onPrice = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const amount = parseAmount(event.target.value);
		setPriceText(
			amount === undefined ? "" : formatNumber(Math.min(amount, MAX_PRICE))
		);
	}, []);
	const onDeposit = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setDeposit(Number(event.target.value));
	}, []);
	const onTerm = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		const value = Number(event.currentTarget.dataset.term);
		if (isTerm(value)) {
			setTerm(value);
		}
	}, []);

	const fill =
		((deposit - MIN_DEPOSIT_PERCENT) /
			(MAX_DEPOSIT_PERCENT - MIN_DEPOSIT_PERCENT)) *
		100;

	return (
		<div
			className={cn(
				"flex flex-col gap-5 rounded-3xl bg-soft p-5 sm:p-6",
				className
			)}
		>
			<div>
				<p className="eyebrow">Finance</p>
				<h3 className="mt-1.5 font-semibold text-[22px] tracking-tight sm:text-[24px]">
					Estimate your repayments
				</h3>
			</div>

			<div>
				<Label htmlFor={`${id}-price`}>Car price</Label>
				<Input
					id={`${id}-price`}
					inputMode="numeric"
					onChange={onPrice}
					prefix="USD"
					value={priceText}
				/>
			</div>

			<div>
				<div className="mb-1 flex items-baseline justify-between">
					<label
						className="font-semibold text-[13.5px]"
						htmlFor={`${id}-deposit`}
					>
						Deposit
					</label>
					<p className="text-[13.5px] text-muted">
						<b className="font-semibold text-ink">{deposit}%</b> ·{" "}
						{formatPrice(estimate.deposit)}
					</p>
				</div>
				<input
					aria-valuetext={`${deposit}% deposit, ${formatPrice(estimate.deposit)}`}
					className="range-slider"
					id={`${id}-deposit`}
					max={MAX_DEPOSIT_PERCENT}
					min={MIN_DEPOSIT_PERCENT}
					onChange={onDeposit}
					step={DEPOSIT_STEP}
					style={{ "--fill": `${fill}%` } as CSSProperties}
					type="range"
					value={deposit}
				/>
				<div className="flex justify-between font-mono text-[11px] text-subtle">
					<span>{MIN_DEPOSIT_PERCENT}%</span>
					<span>{MAX_DEPOSIT_PERCENT}%</span>
				</div>
			</div>

			<fieldset>
				<legend className="mb-2 font-semibold text-[13.5px]">Term</legend>
				<div className="grid grid-cols-4 gap-1 rounded-xl bg-[#e9e9e5] p-1">
					{FINANCE_TERMS.map((months) => (
						<button
							aria-pressed={term === months}
							className={cn(
								"h-10 cursor-pointer rounded-[9px] font-medium text-[14px] transition-colors",
								term === months
									? "bg-white font-semibold text-ink shadow-sm"
									: "text-muted hover:text-ink"
							)}
							data-term={months}
							key={months}
							onClick={onTerm}
							type="button"
						>
							{months} mo
						</button>
					))}
				</div>
			</fieldset>

			<div
				aria-live="polite"
				className="flex items-end justify-between gap-4 rounded-2xl bg-ink px-5 py-5 text-white"
			>
				<div>
					<p className="text-[13px] text-faint">Estimated monthly</p>
					<p className="mt-1 font-bold text-[34px] leading-none tracking-[-0.02em] sm:text-[40px]">
						{formatPrice(estimate.monthly)}
					</p>
				</div>
				<p className="text-right text-[12.5px] text-faint leading-relaxed">
					at {INDICATIVE_ANNUAL_RATE}% a year
					<br />
					{formatPrice(estimate.financed)} financed
				</p>
			</div>
			<p className="text-[12.5px] text-muted">
				Indicative only. Your bank sets the final rate after approval.
			</p>
		</div>
	);
}
