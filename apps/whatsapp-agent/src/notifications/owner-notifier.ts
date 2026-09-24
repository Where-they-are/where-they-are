/** Sends alerts to the owner. WhatsApp in production, a log in tests and scripts. */
export interface OwnerNotifier {
	notifyOwner: (message: string) => Promise<void>;
}

export class ConsoleOwnerNotifier implements OwnerNotifier {
	readonly sent: string[] = [];

	notifyOwner(message: string): Promise<void> {
		this.sent.push(message);
		console.info(`[owner alert]\n${message}\n`);
		return Promise.resolve();
	}
}
