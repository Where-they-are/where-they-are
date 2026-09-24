"use client";

import {
	type ChangeEvent,
	type FormEvent,
	useCallback,
	useId,
	useState,
} from "react";

import { Icon } from "@/components/icons";

const MIN_PHONE_DIGITS = 9;
const NON_DIGITS = /\D/g;

/** "New arrivals on WhatsApp" signup. Demo only: nothing is stored or sent. */
export function FooterSignup() {
	const inputId = useId();
	const [value, setValue] = useState("");
	const [state, setState] = useState<"idle" | "invalid" | "done">("idle");

	const onSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (value.replace(NON_DIGITS, "").length < MIN_PHONE_DIGITS) {
				setState("invalid");
				return;
			}
			setState("done");
			setValue("");
		},
		[value]
	);

	const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setValue(event.target.value);
		setState("idle");
	}, []);

	return (
		<form className="flex flex-col gap-3" noValidate onSubmit={onSubmit}>
			<p className="font-semibold text-[15px]">New arrivals on WhatsApp</p>
			<p className="text-[13.5px] text-faint leading-normal">
				One message when cars you'd like come in.
			</p>
			<label className="sr-only" htmlFor={inputId}>
				Your WhatsApp number
			</label>
			<div className="flex h-[52px] items-center gap-2.5 rounded-full bg-[#1a1b1e] pr-[5px] pl-[18px] shadow-[inset_0_0_0_1px_#2e3034] focus-within:shadow-[inset_0_0_0_1px_var(--color-accent)]">
				<input
					aria-describedby={state === "idle" ? undefined : `${inputId}-status`}
					aria-invalid={state === "invalid" || undefined}
					autoComplete="tel"
					className="min-w-0 flex-1 bg-transparent text-[14.5px] text-white outline-none placeholder:text-subtle"
					id={inputId}
					inputMode="tel"
					onChange={onChange}
					placeholder="+263 WhatsApp number"
					type="tel"
					value={value}
				/>
				<button
					aria-label="Sign up for new arrivals"
					className="grid size-[42px] shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105"
					type="submit"
				>
					<Icon name="arrow" size={16} />
				</button>
			</div>
			{state === "invalid" ? (
				<p className="text-[#ff8a65] text-[13px]" id={`${inputId}-status`}>
					Enter a full WhatsApp number, like +263 77 123 4567.
				</p>
			) : null}
			{state === "done" ? (
				<p
					aria-live="polite"
					className="text-[13px] text-faint"
					id={`${inputId}-status`}
				>
					Sample site: your number wasn't saved. On a real dealership site, this
					would add you to their new-arrivals list.
				</p>
			) : null}
		</form>
	);
}
