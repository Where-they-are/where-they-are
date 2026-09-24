"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ridgeline:saved-vehicles";
const CHANGE_EVENT = "ridgeline:saved-vehicles-change";
const EMPTY: readonly string[] = [];

let cachedRaw: string | null = null;
let cachedIds: readonly string[] = EMPTY;

const readRaw = (): string | null => {
	try {
		return window.localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
};

const getSnapshot = (): readonly string[] => {
	const raw = readRaw();
	if (raw === cachedRaw) {
		return cachedIds;
	}
	cachedRaw = raw;
	try {
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		cachedIds = Array.isArray(parsed)
			? parsed.filter((id): id is string => typeof id === "string")
			: EMPTY;
	} catch {
		cachedIds = EMPTY;
	}
	return cachedIds;
};

const getServerSnapshot = (): readonly string[] => EMPTY;

const subscribe = (onChange: () => void): (() => void) => {
	window.addEventListener(CHANGE_EVENT, onChange);
	window.addEventListener("storage", onChange);
	return () => {
		window.removeEventListener(CHANGE_EVENT, onChange);
		window.removeEventListener("storage", onChange);
	};
};

const write = (ids: readonly string[]) => {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
	} catch {
		// Storage can be unavailable (private mode); saving is a convenience only.
	}
	window.dispatchEvent(new Event(CHANGE_EVENT));
};

/** Saved ("hearted") cars, kept in this browser only. */
export const useSavedVehicles = () => {
	const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const toggle = useCallback((id: string) => {
		const current = getSnapshot();
		write(
			current.includes(id)
				? current.filter((item) => item !== id)
				: [...current, id]
		);
	}, []);

	const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

	return { ids, isSaved, toggle };
};
