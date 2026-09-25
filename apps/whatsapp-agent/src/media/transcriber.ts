import { Agent } from "@mastra/core/agent";

import { angelModels, type ReasoningEffort } from "../agent/angel.js";

export interface AudioClip {
	base64: string;
	mimeType: string;
}

/** Turns a voice note into text. Returns null when it cannot. */
export interface Transcriber {
	transcribe: (audio: AudioClip) => Promise<string | null>;
}

const INSTRUCTIONS = [
	"You transcribe WhatsApp voice notes sent to a Zimbabwean business.",
	"Write exactly what the speaker says, in the language they speak (English, Shona, Ndebele or a mix).",
	"If they speak Shona or Ndebele, add an English translation in brackets after the transcript.",
	"Do not answer, summarise or add anything else. If there is no speech, reply with (no speech).",
].join(" ");

const NO_SPEECH = /^\(?no speech\)?\.?$/i;

/** Transcribes voice notes with the same audio-capable models Angel uses. */
export class ModelTranscriber implements Transcriber {
	private readonly agent: Agent;

	constructor(options: { model: string; reasoningEffort: ReasoningEffort }) {
		this.agent = new Agent({
			id: "angel-transcriber",
			instructions: INSTRUCTIONS,
			model: angelModels(options),
			name: "Angel transcriber",
		});
	}

	async transcribe(audio: AudioClip): Promise<string | null> {
		try {
			const result = await this.agent.generate(
				[
					{
						content: [
							{
								data: `data:${audio.mimeType};base64,${audio.base64}`,
								mimeType: audio.mimeType,
								type: "file",
							},
							{ text: "Transcribe this voice note.", type: "text" },
						],
						role: "user",
					},
				] as never,
				{ modelSettings: { temperature: 0 } }
			);
			const text = (result.text ?? "").trim();
			return text && !NO_SPEECH.test(text) ? text : null;
		} catch {
			return null;
		}
	}
}
