import type { Route } from "next";
import Link from "next/link";
import type {
	ComponentProps,
	InputHTMLAttributes,
	ReactNode,
	SelectHTMLAttributes,
	TextareaHTMLAttributes,
} from "react";

import { Icon } from "@/components/icons";
import { getOneLikeItMessage, whatsappLink } from "@/lib/site";

export const cn = (...classes: (string | false | null | undefined)[]): string =>
	classes.filter(Boolean).join(" ");

type ButtonVariant = "primary" | "outline" | "light" | "ghost-dark";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
	"ghost-dark":
		"border border-white/40 text-white hover:border-white hover:bg-white/10",
	light: "bg-white text-ink hover:bg-soft",
	outline:
		"border border-line-strong bg-white text-ink hover:border-ink hover:bg-soft",
	primary: "bg-ink text-white hover:bg-ink-3",
};

const buttonSizes: Record<ButtonSize, string> = {
	lg: "h-12 px-6 text-[15px]",
	md: "h-11 px-5 text-[14.5px]",
	sm: "h-9 px-4 text-[13.5px]",
};

export const buttonClass = ({
	className,
	size = "md",
	variant = "primary",
}: {
	className?: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
} = {}): string =>
	cn(
		"inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
		buttonVariants[variant],
		buttonSizes[size],
		className
	);

/** Round arrow badge that sits at the end of a pill button. */
export function ArrowBadge({ inverted = false }: { inverted?: boolean }) {
	return (
		<span
			className={cn(
				"-mr-3 grid size-8 place-items-center rounded-full",
				inverted ? "bg-ink text-white" : "bg-white text-ink"
			)}
		>
			<Icon name="arrow" size={16} />
		</span>
	);
}

type ChipProps = ComponentProps<"button"> & {
	active?: boolean;
	count?: number;
	size?: "sm" | "md";
};

export function Chip({
	active = false,
	children,
	className,
	count,
	size = "md",
	type = "button",
	...props
}: ChipProps) {
	return (
		<button
			aria-pressed={active}
			className={cn(
				"inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold transition-colors",
				size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]",
				active
					? "border-ink bg-ink text-white"
					: "border-line-strong bg-white text-ink hover:border-ink",
				className
			)}
			type={type}
			{...props}
		>
			{children}
			{count === undefined ? null : (
				<span
					className={cn(
						"font-mono text-[11.5px]",
						active ? "text-white/60" : "text-subtle"
					)}
				>
					{count}
				</span>
			)}
		</button>
	);
}

export function Label({
	children,
	htmlFor,
	optional = false,
	required = false,
}: {
	children: ReactNode;
	htmlFor?: string;
	optional?: boolean;
	required?: boolean;
}) {
	return (
		<label
			className="mb-2 block font-semibold text-[13.5px] text-ink"
			htmlFor={htmlFor}
		>
			{children}
			{required ? <span className="ml-0.5 text-danger">*</span> : null}
			{optional ? (
				<span className="ml-1 font-normal text-subtle">Optional</span>
			) : null}
		</label>
	);
}

const fieldBase =
	"w-full rounded-xl border bg-white px-3.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-accent/15";

const fieldState = (invalid?: boolean) =>
	invalid ? "border-danger ring-4 ring-danger/10" : "border-line-strong";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	invalid?: boolean;
	prefix?: string;
};

export function Input({ className, invalid, prefix, ...props }: InputProps) {
	if (prefix) {
		return (
			<div className="relative">
				<span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[15px] text-subtle">
					{prefix}
				</span>
				<input
					aria-invalid={invalid || undefined}
					className={cn(
						fieldBase,
						fieldState(invalid),
						"h-12 pl-14",
						className
					)}
					{...props}
				/>
			</div>
		);
	}
	return (
		<input
			aria-invalid={invalid || undefined}
			className={cn(fieldBase, fieldState(invalid), "h-12", className)}
			{...props}
		/>
	);
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
	invalid?: boolean;
};

export function Select({
	children,
	className,
	invalid,
	...props
}: SelectProps) {
	return (
		<div className="relative">
			<select
				aria-invalid={invalid || undefined}
				className={cn(
					fieldBase,
					fieldState(invalid),
					"h-12 cursor-pointer appearance-none pr-10",
					className
				)}
				{...props}
			>
				{children}
			</select>
			<Icon
				className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
				name="chevronDown"
				size={16}
			/>
		</div>
	);
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
	invalid?: boolean;
};

export function Textarea({ className, invalid, ...props }: TextareaProps) {
	return (
		<textarea
			aria-invalid={invalid || undefined}
			className={cn(
				fieldBase,
				fieldState(invalid),
				"min-h-24 resize-y py-3 leading-relaxed",
				className
			)}
			{...props}
		/>
	);
}

export function FieldError({
	children,
	id,
}: {
	children: ReactNode;
	id?: string;
}) {
	return (
		<p
			className="mt-2 flex items-center gap-1.5 text-[13px] text-danger"
			id={id}
		>
			<Icon name="alert" size={15} />
			{children}
		</p>
	);
}

export function FieldHint({ children }: { children: ReactNode }) {
	return <p className="mt-2 text-[12.5px] text-muted">{children}</p>;
}

export function StepHeader({
	step,
	title,
	total,
}: {
	step: number;
	title: string;
	total: number;
}) {
	return (
		<div>
			<div className="flex items-baseline justify-between gap-4">
				<h2 className="font-semibold text-[22px] tracking-tight sm:text-[24px]">
					{title}
				</h2>
				<p className="shrink-0 text-[13px] text-muted">
					<span className="font-semibold text-ink">Step {step}</span> of {total}
				</p>
			</div>
			<div
				aria-label={`Step ${step} of ${total}`}
				aria-valuemax={total}
				aria-valuemin={1}
				aria-valuenow={step}
				className="mt-4 flex gap-1.5"
				role="progressbar"
			>
				{Array.from({ length: total }, (_, index) => (
					<span
						className={cn(
							"h-1 flex-1 rounded-full transition-colors",
							index < step ? "bg-accent" : "bg-line"
						)}
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length progress segments
						key={index}
					/>
				))}
			</div>
		</div>
	);
}

export function Breadcrumbs({
	items,
}: {
	items: { href?: Route; label: string }[];
}) {
	return (
		<nav aria-label="Breadcrumb">
			<ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
				{items.map((item, index) => (
					<li className="flex items-center gap-1.5" key={item.label}>
						{index > 0 ? <Icon name="chevronRight" size={13} /> : null}
						{item.href ? (
							<Link className="hover:text-ink" href={item.href}>
								{item.label}
							</Link>
						) : (
							<span aria-current="page" className="font-medium text-ink">
								{item.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}

/**
 * Shown instead of a real submission: the dealership is fictional, so nothing
 * the visitor typed is sent or stored anywhere.
 */
export function DemoSubmitted({
	onReset,
	resetLabel = "Start again",
	title,
	whatHappens,
}: {
	onReset?: () => void;
	resetLabel?: string;
	title: string;
	whatHappens: string;
}) {
	return (
		<div
			aria-live="polite"
			className="rounded-2xl bg-soft p-5 sm:p-6"
			role="status"
		>
			<span className="grid size-10 place-items-center rounded-full bg-success text-white">
				<Icon name="check" size={20} />
			</span>
			<h3 className="mt-4 font-semibold text-[19px] tracking-tight">{title}</h3>
			<p className="mt-2 text-[14.5px] text-body leading-relaxed">
				This is a sample site, so nothing you typed was sent or saved. On your
				dealership's own site, {whatHappens}
			</p>
			<div className="mt-5 flex flex-wrap gap-2.5">
				<a
					className={buttonClass()}
					href={whatsappLink(getOneLikeItMessage)}
					rel="noopener"
					target="_blank"
				>
					<Icon name="chat" size={17} />
					Get a site like this
				</a>
				{onReset ? (
					<button
						className={buttonClass({ variant: "outline" })}
						onClick={onReset}
						type="button"
					>
						{resetLabel}
					</button>
				) : null}
			</div>
		</div>
	);
}
