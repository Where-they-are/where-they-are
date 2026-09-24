import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
	return (
		<>
			<SiteHeader />
			<main
				className="container-page flex flex-col items-start py-24 lg:py-32"
				id="main"
			>
				<p className="eyebrow">Error 404</p>
				<h1 className="mt-4 max-w-2xl font-semibold text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[56px]">
					We couldn't find that page
				</h1>
				<p className="mt-4 max-w-xl text-[17px] text-muted leading-normal">
					The car may have been sold, or the link may be out of date.
				</p>
				<div className="mt-8 flex flex-wrap gap-3">
					<Link className={buttonClass({ size: "lg" })} href="/stock">
						Browse stock
					</Link>
					<Link
						className={buttonClass({ size: "lg", variant: "outline" })}
						href="/"
					>
						Go home
					</Link>
				</div>
			</main>
		</>
	);
}
