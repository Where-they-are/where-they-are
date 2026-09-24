"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { buttonClass, cn } from "@/components/ui";
import { dealer, demoActionLink } from "@/lib/site";

const primaryNav: { href: Route; label: string }[] = [
	{ href: "/stock", label: "Stock" },
	{ href: "/finance", label: "Finance" },
	{ href: "/sell", label: "Sell your car" },
	{ href: "/service", label: "Service" },
];

const secondaryNav: { href: Route; label: string }[] = [
	{ href: "/#why", label: "About" },
	{ href: "/contact", label: "Contact" },
];

const testDriveHref = "/stock/rm-2214#test-drive" as Route;

const isActive = (pathname: string, href: string): boolean =>
	!href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	// Close the menu whenever the route changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
	useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!menuOpen) {
			return;
		}
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setMenuOpen(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [menuOpen]);

	const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
	const closeMenu = useCallback(() => setMenuOpen(false), []);

	const callLink = demoActionLink(`Call ${dealer.phone.sales}`);

	return (
		<header
			className={cn(
				"relative z-30",
				overlay
					? "lg:absolute lg:inset-x-0 lg:top-0 lg:text-white"
					: "bg-white shadow-[inset_0_-1px_0_var(--color-line)]"
			)}
		>
			<div
				className={cn(
					"flex h-[72px] items-center justify-between gap-4 px-5 md:px-8 lg:grid lg:h-[84px] lg:grid-cols-[1fr_auto_1fr]",
					overlay ? "lg:px-[52px]" : "container-page lg:px-[52px]"
				)}
			>
				<nav aria-label="Main" className="hidden lg:block">
					<ul className="flex gap-[30px] font-medium text-[14.5px]">
						{primaryNav.map((item) => {
							const active = isActive(pathname, item.href);
							return (
								<li key={item.href}>
									<Link
										aria-current={active ? "page" : undefined}
										className={cn(
											"pb-1 transition-colors",
											active &&
												"font-semibold shadow-[inset_0_-1.5px_0_currentColor]",
											!active &&
												(overlay
													? "text-white/85 hover:text-white"
													: "text-muted hover:text-ink")
										)}
										href={item.href}
									>
										{item.label}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				<Logo className={cn(overlay && "lg:text-white")} />

				<div className="hidden items-center justify-end gap-[26px] font-medium text-[14.5px] lg:flex">
					{secondaryNav.map((item) => {
						const active = isActive(pathname, item.href);
						return (
							<Link
								aria-current={active ? "page" : undefined}
								className={cn(
									"pb-1 transition-colors",
									active &&
										"font-semibold shadow-[inset_0_-1.5px_0_currentColor]",
									!active &&
										(overlay
											? "text-white/85 hover:text-white"
											: "text-muted hover:text-ink")
								)}
								href={item.href}
								key={item.href}
							>
								{item.label}
							</Link>
						);
					})}
					<a
						className="hidden items-center gap-2 hover:text-accent xl:flex"
						href={callLink}
						rel="noopener"
						target="_blank"
					>
						<Icon name="phone" size={16} />
						{dealer.phone.sales}
					</a>
					<Link
						className={buttonClass({ variant: overlay ? "light" : "primary" })}
						href={testDriveHref}
					>
						Book a test drive
					</Link>
				</div>

				<div className="flex items-center gap-2.5 lg:hidden">
					<a
						aria-label={`Call ${dealer.name}`}
						className="grid size-11 place-items-center rounded-full border border-line-strong bg-white text-ink"
						href={callLink}
						rel="noopener"
						target="_blank"
					>
						<Icon name="phone" size={18} />
					</a>
					<button
						aria-controls="mobile-menu"
						aria-expanded={menuOpen}
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						className="grid size-11 cursor-pointer place-items-center rounded-full bg-ink text-white"
						onClick={toggleMenu}
						type="button"
					>
						<Icon name={menuOpen ? "x" : "menu"} size={20} />
					</button>
				</div>
			</div>

			<div
				className={cn(
					"fixed inset-x-0 top-0 bottom-0 z-40 flex flex-col bg-white text-ink transition-[opacity,visibility] duration-200 lg:hidden",
					menuOpen ? "visible opacity-100" : "invisible opacity-0"
				)}
				id="mobile-menu"
			>
				<div className="flex h-[72px] items-center justify-between px-5 shadow-[inset_0_-1px_0_var(--color-line)] md:px-8">
					<Logo />
					<button
						aria-label="Close menu"
						className="grid size-11 cursor-pointer place-items-center rounded-full bg-ink text-white"
						onClick={closeMenu}
						type="button"
					>
						<Icon name="x" size={20} />
					</button>
				</div>
				<nav
					aria-label="Mobile"
					className="flex-1 overflow-y-auto px-5 py-6 md:px-8"
				>
					<ul className="flex flex-col">
						{[...primaryNav, ...secondaryNav].map((item) => (
							<li key={item.href}>
								<Link
									className="flex items-center justify-between border-line border-b py-4 font-semibold text-[22px] tracking-tight"
									href={item.href}
									onClick={closeMenu}
								>
									{item.label}
									<Icon className="text-subtle" name="chevronRight" size={18} />
								</Link>
							</li>
						))}
					</ul>
				</nav>
				<div className="grid gap-2.5 p-5 md:px-8">
					<Link
						className={buttonClass({ className: "w-full", size: "lg" })}
						href={testDriveHref}
						onClick={closeMenu}
					>
						Book a test drive
					</Link>
					<a
						className={buttonClass({
							className: "w-full",
							size: "lg",
							variant: "outline",
						})}
						href={callLink}
						rel="noopener"
						target="_blank"
					>
						<Icon name="phone" size={17} />
						{dealer.phone.sales}
					</a>
				</div>
			</div>
		</header>
	);
}
