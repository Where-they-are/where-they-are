import { Icon, type IconName } from "@/components/icons";
import { OpeningHours } from "@/components/opening-hours";
import { StylizedMap } from "@/components/stylized-map";
import { ArrowBadge, buttonClass } from "@/components/ui";
import { dealer, demoActionLink, directionsUrl } from "@/lib/site";

const contacts: { icon: IconName; label: string; value: string }[] = [
	{ icon: "phone", label: "Sales", value: dealer.phone.sales },
	{ icon: "chat", label: "WhatsApp", value: dealer.phone.whatsapp },
	{ icon: "mail", label: "Email", value: dealer.email.sales },
	{ icon: "wrench", label: "Service bookings", value: dealer.phone.service },
];

export function Visit() {
	return (
		<section
			aria-labelledby="visit-heading"
			className="container-page grid gap-6 pt-14 pb-14 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-[104px] lg:pb-[104px]"
		>
			<div className="hidden lg:block">
				<StylizedMap className="h-full min-h-[540px]" />
			</div>

			<div className="flex flex-col gap-6 lg:gap-7 lg:py-3">
				<div className="flex flex-col gap-3">
					<p className="eyebrow">Visit</p>
					<h2
						className="max-w-[12ch] font-semibold text-[30px] leading-[1.02] tracking-[-0.035em] sm:text-[40px] lg:text-[48px]"
						id="visit-heading"
					>
						Come and see the cars in person
					</h2>
				</div>
				<StylizedMap className="h-[200px] lg:hidden" pin="dot" />
				<p className="font-semibold text-[15.5px] lg:hidden">
					{dealer.address}
				</p>
				<OpeningHours />
				<ul className="hidden grid-cols-2 gap-2.5 lg:grid">
					{contacts.map((contact) => (
						<li key={contact.label}>
							<a
								className="flex items-center gap-3 rounded-2xl bg-soft p-3.5 transition-colors hover:bg-line"
								href={demoActionLink(`${contact.label}: ${contact.value}`)}
								rel="noopener"
								target="_blank"
							>
								<span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white">
									<Icon name={contact.icon} size={16} />
								</span>
								<span className="flex min-w-0 flex-col">
									<span className="text-[12px] text-muted">
										{contact.label}
									</span>
									<span className="truncate font-semibold text-[14px]">
										{contact.value}
									</span>
								</span>
							</a>
						</li>
					))}
				</ul>
				<div className="grid grid-cols-2 gap-2.5 sm:flex">
					<a
						className={buttonClass({ size: "lg" })}
						href={directionsUrl}
						rel="noopener"
						target="_blank"
					>
						<Icon className="lg:hidden" name="pin" size={17} />
						<span className="lg:hidden">Directions</span>
						<span className="hidden lg:inline">Get directions</span>
						<span className="hidden lg:inline-flex">
							<ArrowBadge />
						</span>
					</a>
					<a
						className={buttonClass({ size: "lg", variant: "outline" })}
						href={demoActionLink("WhatsApp us from the visit section")}
						rel="noopener"
						target="_blank"
					>
						<Icon name="chat" size={17} />
						<span className="lg:hidden">WhatsApp</span>
						<span className="hidden lg:inline">WhatsApp us</span>
					</a>
				</div>
			</div>
		</section>
	);
}
