import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
	title: "Privacy and terms",
};

export default function PrivacyPage() {
	return (
		<>
			<SiteHeader />
			<main
				className="container-page max-w-3xl pt-10 pb-20 lg:pt-10 lg:pb-28"
				id="main"
			>
				<Breadcrumbs
					items={[{ href: "/", label: "Home" }, { label: "Privacy" }]}
				/>
				<h1 className="mt-5 font-semibold text-[40px] leading-[1.02] tracking-[-0.035em] sm:text-[56px]">
					Privacy and terms
				</h1>
				<div className="mt-8 flex flex-col gap-5 text-[16px] text-body leading-relaxed">
					<p>
						Ridgeline Motors is a fictional dealership. This site is a sample
						made by the team at Where They Are to show what a dealership website
						can look like.
					</p>
					<h2 className="mt-4 font-semibold text-[22px] text-ink tracking-tight">
						What this sample collects
					</h2>
					<p>
						Nothing. The finance, trade-in, service, test-drive and contact
						forms work in your browser only. What you type is not sent to a
						server, not stored and not shared. Photos you choose on the trade-in
						form stay on your device.
					</p>
					<p>
						Buttons that would call or message the dealership open WhatsApp with
						a message to Where They Are instead, so you can ask about a site
						like this. You choose whether to send that message.
					</p>
					<h2
						className="mt-4 font-semibold text-[22px] text-ink tracking-tight"
						id="terms"
					>
						Terms
					</h2>
					<p>
						The vehicles, prices, finance figures, people and contact details on
						this site are sample content. They are not offers and do not
						describe a real business. Finance estimates use an indicative rate
						for illustration only.
					</p>
				</div>
			</main>
		</>
	);
}
