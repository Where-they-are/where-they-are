/**
 * Ridgeline Motors is a fictional dealership. Contact details below are
 * placeholders; every real action on the site routes to Where They Are.
 */
export const dealer = {
	address: "14 Mutare Road, Msasa, Harare",
	addressNote: "Opposite the Msasa Park shops. Free parking on site.",
	city: "Harare",
	email: {
		finance: "finance@ridgelinemotors.co.zw",
		sales: "sales@ridgelinemotors.co.zw",
		service: "service@ridgelinemotors.co.zw",
	},
	founded: 2009,
	hours: [
		{ days: "Monday to Friday", time: "08:00 – 17:30" },
		{ days: "Saturday", time: "08:30 – 14:00" },
		{ days: "Sunday and public holidays", time: "Closed" },
	],
	legalName: "Ridgeline Motors (Pvt) Ltd",
	name: "Ridgeline Motors",
	phone: {
		finance: "0242 000 118",
		sales: "0242 000 110",
		service: "0242 000 115",
		whatsapp: "+263 77 000 0000",
	},
	serviceHours: "Mon – Sat from 07:30",
	suburb: "Msasa",
} as const;

export const whereTheyAre = {
	name: "Where They Are",
} as const;

const DIGITS_ONLY = /\D/g;

/** Builds a wa.me link to the Where They Are WhatsApp number with a prefilled message. */
export const whatsappLink = (
	message: string,
	number: string | undefined = process.env.NEXT_PUBLIC_WTA_WHATSAPP_NUMBER
): string => {
	const digits = (number ?? "").replace(DIGITS_ONLY, "");
	const text = encodeURIComponent(message);
	return digits
		? `https://wa.me/${digits}?text=${text}`
		: `https://wa.me/?text=${text}`;
};

export const getOneLikeItMessage =
	"Hi Where They Are, I've just looked at the Ridgeline Motors sample site and I'd like a website like it for my dealership.";

/** Message used when a visitor taps a dealership contact action on the sample site. */
export const demoActionMessage = (action: string): string =>
	`Hi Where They Are, I tapped "${action}" on the Ridgeline Motors sample site. I'd like to talk about a website like this for my dealership.`;

/**
 * Link for a dealership call or WhatsApp action. The dealership is fictional,
 * so the visitor reaches Where They Are instead of a placeholder number.
 */
export const demoActionLink = (action: string): string =>
	whatsappLink(demoActionMessage(action));

export const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Mutare Road, Msasa, Harare")}`;
