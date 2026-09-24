export const assertOk = async (
	response: Response,
	context: string
): Promise<void> => {
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`${context} failed with ${response.status}: ${body}`);
	}
};

export const assertJson = async <T>(
	response: Response,
	context: string
): Promise<T> => {
	await assertOk(response, context);
	return (await response.json()) as T;
};
