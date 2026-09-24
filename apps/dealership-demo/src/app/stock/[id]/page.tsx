import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getVehicle, vehicles, vehicleTitle } from "@/lib/vehicles";

export const generateStaticParams = () =>
	vehicles.map((vehicle) => ({ id: vehicle.id }));

export default async function VehiclePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const vehicle = getVehicle(id);
	if (!vehicle) {
		notFound();
	}
	return (
		<>
			<SiteHeader />
			<main className="container-page py-24" id="main">
				<h1 className="font-semibold text-5xl tracking-tight">
					{vehicleTitle(vehicle)}
				</h1>
			</main>
		</>
	);
}
