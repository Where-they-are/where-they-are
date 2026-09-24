"use client";

import { type MouseEvent, useCallback } from "react";

import { Icon } from "@/components/icons";
import { buttonClass, cn } from "@/components/ui";
import { useSavedVehicles } from "@/lib/use-saved-vehicles";

/** Round heart toggle shown on vehicle cards. */
export function SaveHeart({
	className,
	vehicleId,
	vehicleName,
}: {
	className?: string;
	vehicleId: string;
	vehicleName: string;
}) {
	const { isSaved, toggle } = useSavedVehicles();
	const saved = isSaved(vehicleId);
	const onClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			toggle(vehicleId);
		},
		[toggle, vehicleId]
	);
	return (
		<button
			aria-label={
				saved ? `Remove ${vehicleName} from saved cars` : `Save ${vehicleName}`
			}
			aria-pressed={saved}
			className={cn(
				"grid size-8 cursor-pointer place-items-center rounded-full bg-white transition-colors hover:text-accent",
				saved ? "text-accent" : "text-ink",
				className
			)}
			onClick={onClick}
			type="button"
		>
			<Icon fill={saved ? "currentColor" : "none"} name="heart" size={15} />
		</button>
	);
}

/** Outline "Save" pill used on the vehicle detail page. */
export function SavePill({
	vehicleId,
	vehicleName,
}: {
	vehicleId: string;
	vehicleName: string;
}) {
	const { isSaved, toggle } = useSavedVehicles();
	const saved = isSaved(vehicleId);
	const onClick = useCallback(() => toggle(vehicleId), [toggle, vehicleId]);
	return (
		<button
			aria-label={
				saved ? `Remove ${vehicleName} from saved cars` : `Save ${vehicleName}`
			}
			aria-pressed={saved}
			className={buttonClass({ size: "sm", variant: "outline" })}
			onClick={onClick}
			type="button"
		>
			<Icon
				className={saved ? "text-accent" : undefined}
				fill={saved ? "currentColor" : "none"}
				name="heart"
				size={15}
			/>
			{saved ? "Saved" : "Save"}
		</button>
	);
}
