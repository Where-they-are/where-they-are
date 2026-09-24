"use client";

import { useCallback, useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { buttonClass } from "@/components/ui";

const COPIED_MS = 2200;

/** Shares a page with the native share sheet, or copies its link as a fallback. */
export function ShareButton({ path, title }: { path: string; title: string }) {
	const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

	useEffect(() => {
		if (status === "idle") {
			return;
		}
		const timer = window.setTimeout(() => setStatus("idle"), COPIED_MS);
		return () => window.clearTimeout(timer);
	}, [status]);

	const onClick = useCallback(async () => {
		const url = new URL(path, window.location.origin).toString();
		if (typeof navigator.share === "function") {
			try {
				await navigator.share({ title, url });
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
			}
		}
		try {
			await navigator.clipboard.writeText(url);
			setStatus("copied");
		} catch {
			setStatus("failed");
		}
	}, [path, title]);

	const labels = {
		copied: "Link copied",
		failed: "Copy failed",
		idle: "Share",
	};

	return (
		<button
			className={buttonClass({ size: "sm", variant: "outline" })}
			onClick={onClick}
			type="button"
		>
			<Icon name={status === "copied" ? "check" : "share"} size={15} />
			<span aria-live="polite">{labels[status]}</span>
		</button>
	);
}
