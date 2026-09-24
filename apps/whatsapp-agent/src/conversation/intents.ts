const OPT_OUT =
	/^\s*(stop|unsubscribe|opt out|opt-out|remove me|don'?t (message|text|contact) me( again)?|leave me alone|no more messages)\s*[.!]*\s*$/i;
const OPT_IN = /^\s*(start|resume|subscribe|opt in|opt-in)\s*[.!]*\s*$/i;

/** A clear request to stop messages. Only whole-message commands count. */
export const isOptOut = (text: string): boolean => OPT_OUT.test(text);

export const isOptIn = (text: string): boolean => OPT_IN.test(text);

export const OPT_OUT_REPLY =
	"No problem, you won't hear from us again. If you ever want a website for your business, just send *START* and we'll pick it up from there.";

export const OPT_IN_REPLY =
	"Welcome back! This is Angel from Where They Are. How can I help you today?";

export const FALLBACK_REPLY =
	"Sorry, I'm having a small technical hiccup on my side. A member of the Where They Are team will get back to you here shortly.";

export const RATE_LIMITED_REPLY =
	"Thanks for all the messages! A member of the team will pick this chat up shortly.";

export const UNSUPPORTED_MEDIA_REPLY =
	"Thanks! I couldn't open that file here. Could you type the key details instead?";
