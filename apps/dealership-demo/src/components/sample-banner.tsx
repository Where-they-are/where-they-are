import { WhereTheyAreMark } from "@/components/icons";
import { getOneLikeItMessage, whatsappLink } from "@/lib/site";

/** Persistent notice that Ridgeline Motors is a sample site by Where They Are. */
export function SampleBanner() {
	return (
		<aside
			aria-label="About this sample site"
			className="flex min-h-[42px] items-center justify-center gap-2.5 bg-soft px-4 py-2 text-[13px] text-body shadow-[inset_0_-1px_0_var(--color-line)] sm:text-[13.5px]"
		>
			<WhereTheyAreMark />
			<p className="text-center">
				<span className="sm:hidden">Sample site by </span>
				<span className="hidden sm:inline">
					This is a sample website made by the team at{" "}
				</span>
				<b className="font-semibold text-ink">Where They Are</b>
				<span className="hidden sm:inline">.</span>
			</p>
			<a
				className="whitespace-nowrap font-semibold text-ink underline underline-offset-[3px] hover:text-accent"
				href={whatsappLink(getOneLikeItMessage)}
				rel="noopener"
				target="_blank"
			>
				Get one like it
			</a>
		</aside>
	);
}
