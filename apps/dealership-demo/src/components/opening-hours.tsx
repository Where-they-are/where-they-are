"use client";

import { useEffect, useState } from "react";

import { cn } from "@/components/ui";
import { dealer } from "@/lib/site";

type RowKey = "weekday" | "saturday" | "sunday";

const ROW_KEYS: RowKey[] = ["weekday", "saturday", "sunday"];

/** Opening minutes per row, in Harare time. Sunday is closed. */
const OPEN_MINUTES: Record<RowKey, [number, number] | null> = {
	saturday: [8 * 60 + 30, 14 * 60],
	sunday: null,
	weekday: [8 * 60, 17 * 60 + 30],
};

const harareNow = (): { minutes: number; row: RowKey } => {
	const parts = new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		hourCycle: "h23",
		minute: "2-digit",
		timeZone: "Africa/Harare",
		weekday: "short",
	}).formatToParts(new Date());
	const get = (type: string) =>
		parts.find((part) => part.type === type)?.value ?? "";
	const weekday = get("weekday");
	const minutes = Number(get("hour")) * 60 + Number(get("minute"));
	if (weekday === "Sat") {
		return { minutes, row: "saturday" };
	}
	if (weekday === "Sun") {
		return { minutes, row: "sunday" };
	}
	return { minutes, row: "weekday" };
};

/** Opening hours with today's row marked open or closed (Harare time). */
export function OpeningHours({
	className,
	showService = true,
}: {
	className?: string;
	showService?: boolean;
}) {
	const [today, setToday] = useState<{ open: boolean; row: RowKey } | null>(
		null
	);

	useEffect(() => {
		const update = () => {
			const { minutes, row } = harareNow();
			const hours = OPEN_MINUTES[row];
			setToday({
				open: hours !== null && minutes >= hours[0] && minutes < hours[1],
				row,
			});
		};
		update();
		const timer = setInterval(update, 60_000);
		return () => clearInterval(timer);
	}, []);

	const rows = dealer.hours.map((hours, index) => ({
		...hours,
		key: ROW_KEYS[index] ?? "weekday",
	}));

	return (
		<dl className={cn("flex flex-col border-ink border-t", className)}>
			{rows.map((row) => {
				const isToday = today?.row === row.key;
				return (
					<div
						className="flex h-[52px] items-center justify-between border-line border-b text-[15px] lg:h-[58px] lg:text-[16px]"
						key={row.key}
					>
						<dt className="flex items-center gap-2.5">
							{isToday ? (
								<span
									className={cn(
										"size-2 rounded-full",
										today?.open ? "bg-success" : "bg-faint"
									)}
								/>
							) : null}
							{row.days}
							{isToday ? (
								<span className="sr-only">
									{today?.open ? " (open now)" : " (closed now)"}
								</span>
							) : null}
						</dt>
						<dd
							className={cn(
								"font-semibold",
								row.time === "Closed" && "font-medium text-muted"
							)}
						>
							{row.time}
						</dd>
					</div>
				);
			})}
			{showService ? (
				<div className="flex h-[52px] items-center justify-between border-line border-b text-[15px] lg:h-[58px] lg:text-[16px]">
					<dt>Service centre</dt>
					<dd className="font-semibold">{dealer.serviceHours}</dd>
				</div>
			) : null}
		</dl>
	);
}
