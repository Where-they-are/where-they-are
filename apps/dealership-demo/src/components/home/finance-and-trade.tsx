"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { FinanceCalculator } from "@/components/finance-calculator";
import { TradeInDetailsStep } from "@/components/trade-in/details-step";
import { StepHeader } from "@/components/ui";
import {
	emptyTradeIn,
	saveTradeInDraft,
	type TradeInDetails,
} from "@/lib/trade-in";

export function FinanceAndTrade() {
	const router = useRouter();
	const onTradeIn = useCallback(
		(details: TradeInDetails) => {
			saveTradeInDraft(details);
			router.push("/sell?step=2");
		},
		[router]
	);

	return (
		<section
			aria-labelledby="finance-trade-heading"
			className="container-page pt-14 pb-14 lg:pt-[104px] lg:pb-[104px]"
		>
			<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<h2
					className="max-w-[14ch] font-semibold text-[28px] leading-[1.05] tracking-[-0.03em] sm:text-[36px] lg:text-[44px]"
					id="finance-trade-heading"
				>
					Finance and trade-ins, before you visit
				</h2>
				<p className="hidden max-w-[300px] text-right text-[15px] text-muted leading-normal lg:block">
					Know your monthly payment and your trade-in value before you come in.
				</p>
			</div>
			<div className="mt-6 grid items-start gap-3.5 lg:mt-8 lg:grid-cols-2">
				<FinanceCalculator />
				<div className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-[0_0_0_1px_var(--color-line),0_30px_60px_-30px_rgba(14,15,17,0.25)] sm:p-6">
					<StepHeader step={1} title="Sell or trade in your car" total={2} />
					<p className="border-line border-b pb-5 text-[14px] text-muted">
						Tell us about the car. We reply with a valuation on WhatsApp,
						usually the same day.
					</p>
					<TradeInDetailsStep
						footerNote="Next: add 3 to 6 photos"
						initial={emptyTradeIn}
						onComplete={onTradeIn}
					/>
				</div>
			</div>
		</section>
	);
}
