"use client";

import { ServerClient } from "@where-they-are/server-client";
import { useEffect, useState } from "react";

import { ENV } from "@/env";

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

const serverClient = new ServerClient({
	baseUrl: ENV.NEXT_PUBLIC_SERVER_BASE_URL,
});

export default function Home() {
	const [status, setStatus] = useState("Checking central server...");

	useEffect(() => {
		let active = true;

		void serverClient
			.getHealth()
			.then((health) => {
				if (active) {
					setStatus(`${health.service} is online`);
				}
			})
			.catch(() => {
				if (active) {
					setStatus("Central server is unavailable");
				}
			});

		return () => {
			active = false;
		};
	}, []);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">Central API Status</h2>
					<p aria-live="polite">{status}</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{ENV.NEXT_PUBLIC_SERVER_BASE_URL}
					</p>
				</section>
			</div>
		</div>
	);
}
