import type { Route } from "next";
import Link from "next/link";

import { FooterSignup } from "@/components/footer-signup";
import { WhereTheyAreMark } from "@/components/icons";
import { Logo } from "@/components/logo";
import { dealer, getOneLikeItMessage, whatsappLink } from "@/lib/site";

const columns: { links: { href: Route; label: string }[]; title: string }[] = [
	{
		links: [
			{ href: "/stock", label: "All cars" },
			{ href: "/stock?condition=New", label: "New cars" },
			{ href: "/stock?condition=Pre-owned", label: "Pre-owned" },
			{ href: "/stock?body=Bakkie", label: "Bakkies" },
			{ href: "/stock?sort=newest", label: "Just arrived" },
		],
		title: "Stock",
	},
	{
		links: [
			{ href: "/finance", label: "Finance" },
			{ href: "/sell", label: "Sell your car" },
			{ href: "/service", label: "Service centre" },
			{ href: "/#why", label: "Warranty" },
		],
		title: "Services",
	},
	{
		links: [
			{ href: "/#why", label: "About us" },
			{ href: "/contact", label: "Contact" },
			{ href: "/contact?topic=other", label: "Careers" },
			{ href: "/privacy", label: "Privacy" },
		],
		title: "Company",
	},
];

function WhereTheyAreCredit() {
	return (
		<div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[14px] text-faint">
			<WhereTheyAreMark size={22} />
			<span>
				Website made by the team at{" "}
				<b className="font-semibold text-white">Where They Are</b>
			</span>
			<a
				className="whitespace-nowrap font-semibold text-white underline underline-offset-[3px] hover:text-accent"
				href={whatsappLink(getOneLikeItMessage)}
				rel="noopener"
				target="_blank"
			>
				Get one like it
			</a>
		</div>
	);
}

export function SiteFooter() {
	const year = new Date().getFullYear();
	return (
		<footer className="mx-3 mb-3 flex flex-col overflow-hidden rounded-[26px] bg-ink px-5 pt-10 text-white sm:px-8 lg:px-12 lg:pt-[72px]">
			<div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,0.55fr)_1fr]">
				<div className="flex flex-col gap-[18px]">
					<Logo className="text-white" size="lg" />
					<p className="hidden max-w-[320px] text-[15px] text-faint leading-relaxed lg:block">
						New and pre-owned cars, finance and servicing. {dealer.suburb},{" "}
						{dealer.city}, since {dealer.founded}.
					</p>
				</div>
				<div className="order-last grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:order-none lg:contents">
					{columns.map((column) => (
						<nav
							aria-label={column.title}
							className={
								column.title === "Company" ? "hidden sm:block" : undefined
							}
							key={column.title}
						>
							<p className="mb-3 text-[13px] text-subtle">{column.title}</p>
							<ul className="flex flex-col gap-3">
								{column.links.map((link) => (
									<li key={link.label}>
										<Link
											className="text-[15px] transition-colors hover:text-accent"
											href={link.href}
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					))}
				</div>
				<FooterSignup />
			</div>

			<div className="mt-10 border-ink-3 border-t pt-6 lg:hidden">
				<WhereTheyAreCredit />
			</div>

			<p
				aria-hidden="true"
				className="order-last mt-10 -mb-[0.1em] select-none text-center font-bold text-[clamp(64px,17.4vw,250px)] text-outline-fade leading-[0.8] tracking-[-0.055em] lg:order-none lg:mt-14"
			>
				RIDGELINE
			</p>

			<div className="flex flex-col gap-4 py-6 text-[13.5px] text-subtle shadow-[inset_0_1px_0_var(--color-ink-3)] lg:flex-row lg:items-center lg:justify-between">
				<p>
					© {year} {dealer.legalName} ·{" "}
					<Link className="hover:text-white" href="/privacy">
						Privacy
					</Link>{" "}
					·{" "}
					<Link className="hover:text-white" href="/privacy#terms">
						Terms
					</Link>
				</p>
				<div className="hidden lg:block">
					<WhereTheyAreCredit />
				</div>
			</div>
		</footer>
	);
}
