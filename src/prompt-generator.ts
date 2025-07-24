import type { ProofreaderSettings } from "src/settings";

export function generateDynamicPrompt(settings: ProofreaderSettings): string {
	const { proofreadingMode, severityLevel } = settings;
	
	// Base instruction that's always included
	const baseInstruction = "Output only the revised text and nothing else. The text is:";
	
	// Mode-specific instructions
	const modeInstructions = {
		"quick-fix": "Focus only on correcting grammar, spelling, and punctuation errors. Do not change the writing style, tone, or structure. Make minimal changes to preserve the original voice.",
		
		"balanced": "Act as a professional editor. Improve clarity, readability, grammar, and language while preserving the original meaning and technical jargon. Make balanced improvements to both correctness and style.",
		
		"style-improvement": "Focus on enhancing tone, clarity, flow, and overall writing style. Improve sentence structure, word choice, and readability while maintaining the author's voice. Address grammar issues as needed.",
		
		"academic": "Edit for formal academic writing standards. Ensure proper grammar, formal tone, clear argumentation, and appropriate academic language. Improve clarity and precision while maintaining scholarly voice. Pay attention to citation formatting if present.",
		
		"creative": "Enhance the creative voice and storytelling elements. Improve flow, rhythm, and expressiveness while preserving the author's unique style and creativity. Focus on making the writing more engaging and vivid."
	};
	
	// Severity-specific modifiers
	const severityModifiers = {
		"minor": "Make only essential changes. Preserve the original text as much as possible and only fix clear errors or obvious improvements.",
		
		"moderate": "Make balanced improvements. Suggest changes that significantly enhance the text while respecting the original structure and style.",
		
		"major": "Provide comprehensive editing. Feel free to restructure sentences, improve word choice extensively, and make substantial improvements to enhance overall quality and readability."
	};
	
	// Combine the instructions
	const modeInstruction = modeInstructions[proofreadingMode];
	const severityModifier = severityModifiers[severityLevel];
	
	return `${modeInstruction} ${severityModifier} ${baseInstruction}`;
}

// Function to get the effective prompt (dynamic or static)
export function getEffectivePrompt(settings: ProofreaderSettings): string {
	// If using custom static prompt, return it as-is
	if (settings.staticPrompt !== getDefaultStaticPrompt()) {
		return settings.staticPrompt;
	}
	
	// Otherwise, generate dynamic prompt
	return generateDynamicPrompt(settings);
}

// Helper to get the default static prompt
export function getDefaultStaticPrompt(): string {
	return "Act as a professional editor. Please make suggestions how to improve clarity, readability, grammar, and language of the following text. Preserve the original meaning and any technical jargon. Suggest structural changes only if they significantly improve flow or understanding. Avoid unnecessary expansion or major reformatting (e.g., no unwarranted lists). Try to make as little changes as possible, refrain from doing any changes when the writing is already sufficiently clear and concise. Output only the revised text and nothing else. The text is:";
}