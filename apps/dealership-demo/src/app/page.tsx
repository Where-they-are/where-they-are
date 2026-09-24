import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
	return (
		<>
			<SiteHeader />
			<main className="container-page py-24" id="main">
				<p className="eyebrow">Sample site · Car dealership</p>
				<h1 className="mt-3 font-bold text-5xl tracking-tight">
					Ridgeline Motors
				</h1>
			</main>
		</>
	);
}
