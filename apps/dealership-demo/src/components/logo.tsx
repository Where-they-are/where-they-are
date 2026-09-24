import Link from "next/link";

import { cn } from "@/components/ui";

export function Logo({
	className,
	size = "md",
}: {
	className?: string;
	size?: "sm" | "md" | "lg";
}) {
	const word = {
		lg: "text-[22px]",
		md: "text-[18px] sm:text-[20px]",
		sm: "text-[17px]",
	}[size];
	const tagline = {
		lg: "text-[10.5px]",
		md: "text-[8.5px] sm:text-[9.5px]",
		sm: "text-[8.5px]",
	}[size];
	return (
		<Link
			aria-label="Ridgeline Motors, home"
			className={cn("inline-flex flex-col gap-[3px] leading-none", className)}
			href="/"
		>
			<span className={cn("font-bold tracking-[0.2em]", word)}>RIDGELINE</span>
			<span className={cn("font-mono tracking-[0.32em] opacity-70", tagline)}>
				MOTORS · HARARE
			</span>
		</Link>
	);
}
