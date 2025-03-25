export const TEMPERATURE = 0.5; // 0 - 2
export const FREQUENCY_PENALTY = -0.3; // -2 - 2
export const OPENAI_MODEL = "gpt-4o-mini";

export const STATIC_PROMPT = `Please make suggestions how to improve
readability, grammar, and language of the following text. Do not change anything
about the content, and refrain from doing any changes when the writing is
already sufficiently clear and concise. Try to make as little changes as
possible. Output only the changed text and nothing else. The text is:`;

//──────────────────────────────────────────────────────────────────────────────

// TEMP OPENAI API KEY
import { config } from "dotenv";
config({ path: process.env.HOME + "/Developer/obsidian-proofreader/.env" });
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
