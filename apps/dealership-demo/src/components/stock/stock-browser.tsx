"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	type ChangeEvent,
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { Icon } from "@/components/icons";
import {
	ActiveFilterChips,
	FiltersPanel,
} from "@/components/stock/filters-panel";
import { Breadcrumbs, buttonClass, cn } from "@/components/ui";
import { VehicleCard } from "@/components/vehicle-card";
import { demoActionLink } from "@/lib/site";
import {
	activeFilterChips,
	applyFilters,
	emptyFilters,
	filtersToQuery,
	PAGE_SIZE,
	parseFilters,
	SORT_OPTIONS,
	type SortValue,
	type StockFilters,
} from "@/lib/stock";
import { vehicles } from "@/lib/vehicles";

type View = "grid" | "list";

const summary = (filters: StockFilters): string => {
	const labels = activeFilterChips(filters).map((chip, index) =>
		index === 0
			? chip.label
			: chip.label.charAt(0).toLowerCase() + chip.label.slice(1)
	);
	const lead = labels.length > 0 ? `${labels.join(", ")}. ` : "";
	return `${lead}Every car has been through our workshop before it goes on sale.`;
};

const positivePage = (value: string | null): number => {
	const parsed = Number.parseInt(value ?? "1", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export function StockBrowser() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
	const page = positivePage(searchParams.get("page"));
	const [view, setView] = useState<View>("grid");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [mobileVisible, setMobileVisible] = useState(PAGE_SIZE);
	const resultsRef = useRef<HTMLDivElement>(null);

	const results = useMemo(() => applyFilters(vehicles, filters), [filters]);
	const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
	const currentPage = Math.min(page, pageCount);
	const chipCount = activeFilterChips(filters).length;

	const navigate = useCallback(
		(next: StockFilters, nextPage = 1) => {
			const params = new URLSearchParams(filtersToQuery(next));
			if (nextPage > 1) {
				params.set("page", String(nextPage));
			}
			const query = params.toString();
			router.replace((query ? `${pathname}?${query}` : pathname) as Route, {
				scroll: false,
			});
		},
		[pathname, router]
	);

	// New filters start the mobile list from the top again.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset when filters change
	useEffect(() => {
		setMobileVisible(PAGE_SIZE);
	}, [filters]);

	useEffect(() => {
		if (!sheetOpen) {
			return;
		}
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setSheetOpen(false);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = previous;
			window.removeEventListener("keydown", onKey);
		};
	}, [sheetOpen]);

	const onFilters = useCallback(
		(next: StockFilters) => navigate(next),
		[navigate]
	);
	const onSort = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) =>
			navigate({ ...filters, sort: event.target.value as SortValue }),
		[filters, navigate]
	);
	const onView = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		setView(event.currentTarget.dataset.view === "list" ? "list" : "grid");
	}, []);
	const onPage = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			navigate(filters, Number(event.currentTarget.dataset.page));
			resultsRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		},
		[filters, navigate]
	);
	const onShowMore = useCallback(
		() => setMobileVisible((count) => count + PAGE_SIZE),
		[]
	);
	const openSheet = useCallback(() => setSheetOpen(true), []);
	const closeSheet = useCallback(() => setSheetOpen(false), []);
	const onClear = useCallback(
		() => navigate({ ...emptyFilters, sort: filters.sort }),
		[filters.sort, navigate]
	);

	const pageStart = (currentPage - 1) * PAGE_SIZE;
	const pageEnd = pageStart + PAGE_SIZE;
	const remaining = results.length - mobileVisible;
	const requestLink = demoActionLink("Request a car");

	return (
		<main className="container-page pt-6 pb-16 lg:pt-10 lg:pb-24" id="main">
			<div className="hidden lg:block">
				<Breadcrumbs
					items={[{ href: "/", label: "Home" }, { label: "Stock" }]}
				/>
			</div>

			<div className="flex flex-col gap-4 lg:mt-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
				<div className="flex flex-col gap-3">
					<h1
						aria-live="polite"
						className="font-semibold text-[32px] leading-[1.02] tracking-[-0.035em] sm:text-[44px] lg:text-[56px]"
					>
						{results.length}{" "}
						{results.length === 1 ? "car matches" : "cars match"}
					</h1>
					<p className="hidden max-w-[620px] text-[17px] text-muted leading-normal lg:block">
						{summary(filters)}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-2.5 lg:flex lg:items-center">
					<button
						className={buttonClass({ className: "lg:hidden" })}
						onClick={openSheet}
						type="button"
					>
						<Icon name="sliders" size={17} />
						Filters{chipCount > 0 ? ` · ${chipCount}` : ""}
					</button>
					<div
						aria-label="Layout"
						className="hidden rounded-xl bg-soft p-1 lg:flex"
						role="toolbar"
					>
						{(["grid", "list"] as const).map((option) => (
							<button
								aria-label={option === "grid" ? "Grid view" : "List view"}
								aria-pressed={view === option}
								className={cn(
									"grid size-10 cursor-pointer place-items-center rounded-[9px] transition-colors",
									view === option
										? "bg-white shadow-sm"
										: "text-muted hover:text-ink"
								)}
								data-view={option}
								key={option}
								onClick={onView}
								type="button"
							>
								<Icon name={option} size={17} />
							</button>
						))}
					</div>
					<div className="relative">
						<label className="sr-only" htmlFor="stock-sort">
							Sort cars
						</label>
						<select
							className="h-11 w-full cursor-pointer appearance-none rounded-full border border-line-strong bg-white pr-9 pl-3.5 font-semibold text-[13px] outline-none focus:border-ink sm:text-[14.5px] lg:h-12 lg:w-auto lg:rounded-xl lg:font-medium"
							id="stock-sort"
							onChange={onSort}
							value={filters.sort}
						>
							{SORT_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									Sort: {option.label}
								</option>
							))}
						</select>
						<Icon
							className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted"
							name="chevronDown"
							size={16}
						/>
					</div>
				</div>

				<div className="lg:hidden">
					<ActiveFilterChips
						filters={filters}
						onChange={onFilters}
						tone="light"
					/>
				</div>
			</div>

			<div
				className="mt-6 grid scroll-mt-6 gap-6 lg:mt-8 lg:grid-cols-[270px_1fr]"
				ref={resultsRef}
			>
				<aside
					aria-label="Filters"
					className="hidden self-start rounded-[20px] bg-soft p-5 lg:block"
				>
					<FiltersPanel filters={filters} onChange={onFilters} />
				</aside>

				<div className="flex flex-col gap-4">
					{results.length === 0 ? (
						<div className="flex flex-col items-start gap-4 rounded-[20px] bg-soft p-6 sm:p-8">
							<h2 className="font-semibold text-[22px] tracking-tight">
								No cars match these filters
							</h2>
							<p className="max-w-md text-[15px] text-muted leading-normal">
								Try removing a filter, or tell us what you're looking for and
								we'll source it.
							</p>
							<div className="flex flex-wrap gap-2.5">
								<button
									className={buttonClass()}
									onClick={onClear}
									type="button"
								>
									Clear filters
								</button>
								<a
									className={buttonClass({ variant: "outline" })}
									href={requestLink}
									rel="noopener"
									target="_blank"
								>
									<Icon name="chat" size={16} />
									Request a car
								</a>
							</div>
						</div>
					) : (
						<ul
							className={cn(
								"grid gap-3.5",
								view === "grid"
									? "sm:grid-cols-2 xl:grid-cols-3"
									: "grid-cols-1"
							)}
						>
							{results.map((vehicle, index) => (
								<li
									className={cn(
										(index < pageStart || index >= pageEnd) && "lg:hidden",
										index >= mobileVisible && "max-lg:hidden"
									)}
									key={vehicle.id}
								>
									<VehicleCard
										index={index}
										layout={view}
										priority={index < 3}
										vehicle={vehicle}
									/>
								</li>
							))}
						</ul>
					)}

					{results.length > 0 && remaining > 0 ? (
						<button
							className={buttonClass({
								className: "w-full lg:hidden",
								size: "lg",
								variant: "outline",
							})}
							onClick={onShowMore}
							type="button"
						>
							Show {Math.min(remaining, PAGE_SIZE)} more
						</button>
					) : null}

					<div className="flex flex-col items-start justify-between gap-4 rounded-[20px] bg-ink p-5 text-white sm:flex-row sm:items-center sm:px-6">
						<div>
							<p className="font-semibold text-[17px]">
								Can't see the car you want?
							</p>
							<p className="mt-1 text-[13.5px] text-faint">
								Tell us the make, year and budget. We source from trusted
								dealers in South Africa and Japan.
							</p>
						</div>
						<a
							className={buttonClass({ variant: "light" })}
							href={requestLink}
							rel="noopener"
							target="_blank"
						>
							<Icon name="chat" size={16} />
							Request a car
						</a>
					</div>

					{pageCount > 1 ? (
						<nav
							aria-label="Pagination"
							className="hidden items-center justify-center gap-2 pt-2 lg:flex"
						>
							<button
								aria-label="Previous page"
								className="grid size-11 cursor-pointer place-items-center rounded-xl shadow-[inset_0_0_0_1px_var(--color-line)] disabled:cursor-not-allowed disabled:opacity-40"
								data-page={currentPage - 1}
								disabled={currentPage === 1}
								onClick={onPage}
								type="button"
							>
								<Icon name="chevronLeft" size={15} />
							</button>
							{Array.from({ length: pageCount }, (_, index) => index + 1).map(
								(number) => (
									<button
										aria-current={number === currentPage ? "page" : undefined}
										className={cn(
											"grid size-11 cursor-pointer place-items-center rounded-xl font-semibold text-[14.5px] transition-colors",
											number === currentPage
												? "bg-ink text-white"
												: "shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-soft"
										)}
										data-page={number}
										key={number}
										onClick={onPage}
										type="button"
									>
										{number}
									</button>
								)
							)}
							<button
								aria-label="Next page"
								className="grid size-11 cursor-pointer place-items-center rounded-xl shadow-[inset_0_0_0_1px_var(--color-line)] disabled:cursor-not-allowed disabled:opacity-40"
								data-page={currentPage + 1}
								disabled={currentPage === pageCount}
								onClick={onPage}
								type="button"
							>
								<Icon name="chevronRight" size={15} />
							</button>
						</nav>
					) : null}
				</div>
			</div>

			<div
				aria-hidden={!sheetOpen}
				className={cn(
					"fixed inset-0 z-40 lg:hidden",
					sheetOpen ? "visible" : "invisible"
				)}
			>
				<button
					aria-label="Close filters"
					className={cn(
						"absolute inset-0 cursor-default bg-ink/40 transition-opacity duration-300",
						sheetOpen ? "opacity-100" : "opacity-0"
					)}
					onClick={closeSheet}
					tabIndex={-1}
					type="button"
				/>
				<div
					aria-labelledby="filter-sheet-title"
					aria-modal="true"
					className={cn(
						"absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col rounded-t-[26px] bg-white transition-transform duration-300 ease-out",
						sheetOpen ? "translate-y-0" : "translate-y-full"
					)}
					role="dialog"
				>
					<div className="flex items-center justify-between border-line border-b px-5 py-4">
						<h2 className="font-semibold text-[18px]" id="filter-sheet-title">
							Filters
						</h2>
						<div className="flex items-center gap-3">
							{chipCount > 0 ? (
								<button
									className="cursor-pointer font-semibold text-[13.5px] underline underline-offset-[3px]"
									onClick={onClear}
									type="button"
								>
									Clear all
								</button>
							) : null}
							<button
								aria-label="Close filters"
								className="grid size-9 cursor-pointer place-items-center rounded-full bg-soft"
								onClick={closeSheet}
								type="button"
							>
								<Icon name="x" size={17} />
							</button>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto px-5 py-4">
						<FiltersPanel
							filters={filters}
							onChange={onFilters}
							showHeader={false}
						/>
					</div>
					<div className="border-line border-t p-4">
						<button
							className={buttonClass({ className: "w-full", size: "lg" })}
							onClick={closeSheet}
							type="button"
						>
							Show {results.length} {results.length === 1 ? "car" : "cars"}
						</button>
					</div>
				</div>
			</div>
		</main>
	);
}
