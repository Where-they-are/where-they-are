import { Icon } from "@/components/icons";
import { cn } from "@/components/ui";
import { dealer } from "@/lib/site";

const roadLabel =
	"absolute whitespace-nowrap font-semibold text-[#6b6f66] text-[12px] tracking-[0.04em]";

/**
 * Illustrated street map from the design. It is decorative, not a real map,
 * so the dealership's directions link carries the actual location.
 */
export function StylizedMap({
	className,
	pin = "card",
}: {
	className?: string;
	pin?: "card" | "dot" | "none";
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-3xl bg-[#e4e6e2]",
				className
			)}
		>
			<div
				aria-hidden="true"
				className="absolute inset-0 overflow-hidden bg-map"
			>
				<div className="absolute top-[8%] left-[-5%] h-[30%] w-[38%] rounded-[10px] bg-map-park" />
				<div className="absolute right-[6%] bottom-[6%] h-[26%] w-[30%] rounded-[10px] bg-map-park" />
				<div className="absolute top-[6%] left-[52%] h-[18%] w-[22%] rounded-md bg-map-block" />
				<div className="absolute top-[58%] left-[14%] h-[22%] w-[24%] rounded-md bg-map-block" />
				<div className="absolute top-[47%] right-[-10%] left-[-10%] h-[22px] -rotate-[8deg] bg-white shadow-[0_0_0_1px_#d2d5ce]" />
				<div className="absolute top-[-10%] bottom-[-10%] left-[44%] w-3 rotate-[14deg] bg-white shadow-[0_0_0_1px_#d9dcd6]" />
				<div className="absolute top-[-10%] bottom-[-10%] left-[76%] w-2.5 -rotate-[6deg] bg-white shadow-[0_0_0_1px_#d9dcd6]" />
				<div className="absolute top-[22%] right-[-10%] left-[-10%] h-[9px] rotate-[3deg] bg-white shadow-[0_0_0_1px_#d9dcd6]" />
				<div className="absolute top-[80%] right-[-10%] left-[-10%] h-[9px] -rotate-[2deg] bg-white shadow-[0_0_0_1px_#d9dcd6]" />
				<span
					className={cn(
						roadLabel,
						"top-[calc(47%-20px)] left-[8%] -rotate-[8deg]"
					)}
				>
					MUTARE ROAD
				</span>
				<span className={cn(roadLabel, "top-[18%] left-[6%]")}>MSASA PARK</span>
				<span className={cn(roadLabel, "top-[30%] left-[47%] rotate-[76deg]")}>
					ARDBENNIE RD
				</span>
			</div>

			{pin === "dot" ? (
				<span className="absolute top-[47%] left-[50%] grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent/25">
					<span className="grid size-9 place-items-center rounded-full bg-accent text-ink shadow-[0_8px_20px_-6px_rgba(255,90,31,0.7)]">
						<Icon name="pin" size={17} />
					</span>
				</span>
			) : null}

			{pin === "card" ? (
				<div className="absolute bottom-6 left-6 flex items-center gap-3.5 rounded-2xl bg-white px-[18px] py-4 shadow-[0_20px_40px_-20px_rgba(14,15,17,0.4)]">
					<span className="grid size-10 place-items-center rounded-xl bg-accent text-ink">
						<Icon name="pin" size={19} />
					</span>
					<span className="flex flex-col gap-0.5">
						<span className="font-semibold text-[15px]">{dealer.name}</span>
						<span className="text-[13.5px] text-muted">{dealer.address}</span>
					</span>
				</div>
			) : null}
		</div>
	);
}
