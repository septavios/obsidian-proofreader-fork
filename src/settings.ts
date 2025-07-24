import { PluginSettingTab, Setting, Modal, TextComponent, DropdownComponent } from "obsidian";
import type Proofreader from "src/main";
import type { ModelName } from "src/providers/adapter";
import { MODEL_SPECS, getAllModels, getModelSpec } from "src/providers/model-info";

export const DEFAULT_SETTINGS = {
	openAiApiKey: "",
	customApiKey: "",
	customApiEndpoint: "",
	model: "gpt-4.1-nano" as ModelName,
	customModels: [] as Array<{
		id: string;
		displayName: string;
		provider: "openai" | "openai-compatible";
		maxOutputTokens: number;
	}>,
	proofreadingMode: "balanced" as "quick-fix" | "style-improvement" | "academic" | "creative" | "balanced",
	severityLevel: "moderate" as "minor" | "moderate" | "major",
	staticPrompt:
		"Act as a professional editor. Please make suggestions how to improve clarity, readability, grammar, and language of the following text. Preserve the original meaning and any technical jargon. Suggest structural changes only if they significantly improve flow or understanding. Avoid unnecessary expansion or major reformatting (e.g., no unwarranted lists). Try to make as little changes as possible, refrain from doing any changes when the writing is already sufficiently clear and concise. Output only the revised text and nothing else. The text is:",
	preserveTextInsideQuotes: false,
	preserveBlockquotes: false,
	preserveNonSmartPuncation: false,
	diffWithSpace: false,
};

export type ProofreaderSettings = typeof DEFAULT_SETTINGS;

//──────────────────────────────────────────────────────────────────────────────

// DOCS https://docs.obsidian.md/Plugins/User+interface/Settings
export class ProofreaderSettingsMenu extends PluginSettingTab {
	plugin: Proofreader;

	constructor(plugin: Proofreader) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.settings;

		containerEl.empty();

		// API KEYS
		new Setting(containerEl).setName("OpenAI API key").addText((input) => {
			input.inputEl.type = "password"; // obfuscates the field
			input.inputEl.setCssProps({ width: "100%" });
			input
				.setPlaceholder("sk-123456789…")
				.setValue(settings.openAiApiKey)
				.onChange(async (value) => {
					settings.openAiApiKey = value.trim();
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl)
			.setName("Custom API key")
			.setDesc("API key for OpenAI-compatible services (e.g., Qwen, DeepSeek, etc.)")
			.addText((input) => {
				input.inputEl.type = "password";
				input.inputEl.setCssProps({ width: "100%" });
				input
					.setPlaceholder("your-api-key")
					.setValue(settings.customApiKey)
					.onChange(async (value) => {
						settings.customApiKey = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Custom API endpoint")
			.setDesc("Base URL for OpenAI-compatible API (e.g., https://dashscope.aliyuncs.com/compatible-mode/v1)")
			.addText((input) => {
				input.inputEl.setCssProps({ width: "100%" });
				input
					.setPlaceholder("https://api.example.com/v1")
					.setValue(settings.customApiEndpoint)
					.onChange(async (value) => {
						settings.customApiEndpoint = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Model")
			.setDesc(
				"The nano model is slightly quicker and cheaper. " +
					"The mini model is slightly higher quality, but also more expensive. ",
			)
			.addDropdown((dropdown) => {
				// Add built-in models
				for (const key in MODEL_SPECS) {
					if (!Object.hasOwn(MODEL_SPECS, key)) continue;
					const model = MODEL_SPECS[key as keyof typeof MODEL_SPECS];
					dropdown.addOption(key, model.displayText);
				}
				
				// Add custom models
				for (const customModel of settings.customModels) {
					dropdown.addOption(customModel.id, `${customModel.displayName} (Custom)`);
				}
				
				dropdown.setValue(settings.model).onChange(async (value) => {
					settings.model = value as ModelName;
					await this.plugin.saveSettings();
				});
			});

		//────────────────────────────────────────────────────────────────────────
		// PROOFREADING OPTIONS
		new Setting(containerEl).setName("Proofreading Options").setHeading();

		new Setting(containerEl)
			.setName("Proofreading Mode")
			.setDesc("Choose the type of proofreading to perform")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("quick-fix", "Quick Fix - Grammar & spelling only")
					.addOption("balanced", "Balanced - Grammar, clarity & style")
					.addOption("style-improvement", "Style Improvement - Tone, clarity & flow")
					.addOption("academic", "Academic - Formal writing & citations")
					.addOption("creative", "Creative - Voice & creativity")
					.setValue(settings.proofreadingMode)
					.onChange(async (value) => {
						settings.proofreadingMode = value as typeof settings.proofreadingMode;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Severity Level")
			.setDesc("How extensive should the changes be?")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("minor", "Minor - Only fix obvious errors")
					.addOption("moderate", "Moderate - Balanced improvements")
					.addOption("major", "Major - Comprehensive rewriting")
					.setValue(settings.severityLevel)
					.onChange(async (value) => {
						settings.severityLevel = value as typeof settings.severityLevel;
						await this.plugin.saveSettings();
					});
			});

		//────────────────────────────────────────────────────────────────────────
		// CUSTOM MODELS
		new Setting(containerEl).setName("Custom Models").setHeading();

		new Setting(containerEl)
			.setName("Add Custom Model")
			.setDesc("Add your own models for testing (e.g., qwen-plus, claude-3-haiku, etc.)")
			.addButton((button) => {
				button.setButtonText("Add Model").onClick(() => {
					this.showAddModelModal();
				});
			});

		// Display existing custom models
		for (let i = 0; i < settings.customModels.length; i++) {
			const customModel = settings.customModels[i];
			new Setting(containerEl)
				.setName(customModel.displayName)
				.setDesc(`ID: ${customModel.id} | Provider: ${customModel.provider} | Max tokens: ${customModel.maxOutputTokens}`)
				.addButton((button) => {
					button.setButtonText("Remove").onClick(async () => {
						settings.customModels.splice(i, 1);
						await this.plugin.saveSettings();
						this.display(); // Refresh the settings display
					});
				});
		}

		//────────────────────────────────────────────────────────────────────────
		// DIFF OPTIONS
		new Setting(containerEl).setName("Diff options").setHeading();

		new Setting(containerEl)
			.setName("Space-sensitive diff")
			.setDesc(
				"Space-sensitive diff processes spaces more accurately, but results in smaller, more numerous changes.",
			)
			.addToggle((toggle) =>
				toggle.setValue(settings.diffWithSpace).onChange(async (value) => {
					settings.diffWithSpace = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Preserve text inside quotes")
			.setDesc(
				'No changes will be made to text inside quotation marks (""). ' +
					"Note that this is not perfect, as the AI will sometimes suggest changes across quotes.",
			)
			.addToggle((toggle) =>
				toggle.setValue(settings.preserveTextInsideQuotes).onChange(async (value) => {
					settings.preserveTextInsideQuotes = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName("Preserve text in blockquotes and callouts")
			.setDesc(
				"No changes will be made to lines beginning with `>`. " +
					"Note that this is not perfect, as the AI will sometimes suggest changes across paragraphs.",
			)
			.addToggle((toggle) =>
				toggle.setValue(settings.preserveBlockquotes).onChange(async (value) => {
					settings.preserveBlockquotes = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName("Preserve non-smart punctuation")
			.setDesc(
				"Prevent the AI from changing non-smart punctuation to their smart counterparts, " +
					' for instance changing `"` to `“` or `12-34` to `12–34`. ' +
					"This can be relevant when using tools like `pandoc`, which convert non-smart punctuation based on how they are configured.",
			)
			.addToggle((toggle) =>
				toggle.setValue(settings.preserveNonSmartPuncation).onChange(async (value) => {
					settings.preserveNonSmartPuncation = value;
					await this.plugin.saveSettings();
				}),
			);

		//────────────────────────────────────────────────────────────────────────
		// ADVANCED
		new Setting(containerEl).setName("Advanced").setHeading();

		new Setting(containerEl)
			.setName("System prompt")
			.setDesc(
				"The LLM must respond ONLY with the updated text for this plugin to work. " +
					"Most users do not need to change this setting. " +
					"When using the default prompt, the proofreading mode and severity level above will automatically customize the instructions. " +
					"If you modify this prompt, the mode and severity settings will be ignored. " +
					"Only change this if you know what you are doing.",
			)
			.addTextArea((textarea) => {
				textarea.inputEl.setCssProps({ width: "25vw", height: "15em" });
				textarea
					.setValue(settings.staticPrompt)
					.setPlaceholder("Make suggestions based on…")
					.onChange(async (value) => {
						if (value.trim() === "") return;
						settings.staticPrompt = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}

	showAddModelModal(): void {
		new AddModelModal(this.app, this.plugin, (modelData) => {
			this.plugin.settings.customModels.push(modelData);
			this.plugin.saveSettings();
			this.display(); // Refresh the settings display
		}).open();
	}
}

class AddModelModal extends Modal {
	plugin: Proofreader;
	onSubmit: (modelData: {
		id: string;
		displayName: string;
		provider: "openai" | "openai-compatible";
		maxOutputTokens: number;
	}) => void;

	constructor(
		app: any,
		plugin: Proofreader,
		onSubmit: (modelData: {
			id: string;
			displayName: string;
			provider: "openai" | "openai-compatible";
			maxOutputTokens: number;
		}) => void
	) {
		super(app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
	}

	override onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Add Custom Model" });

		let modelId = "";
		let displayName = "";
		let provider: "openai" | "openai-compatible" = "openai-compatible";
		let maxOutputTokens = 32768;

		new Setting(contentEl)
			.setName("Model ID")
			.setDesc("The exact model identifier (e.g., qwen-plus, claude-3-haiku)")
			.addText((text) => {
				text.setPlaceholder("qwen-plus")
					.onChange((value) => {
						modelId = value.trim();
					});
			});

		new Setting(contentEl)
			.setName("Display Name")
			.setDesc("Human-readable name for the model")
			.addText((text) => {
				text.setPlaceholder("Qwen Plus")
					.onChange((value) => {
						displayName = value.trim();
					});
			});

		new Setting(contentEl)
			.setName("Provider")
			.setDesc("Which API provider this model uses")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("openai-compatible", "OpenAI-Compatible")
					.addOption("openai", "OpenAI")
					.setValue(provider)
					.onChange((value) => {
						provider = value as "openai" | "openai-compatible";
					});
			});

		new Setting(contentEl)
			.setName("Max Output Tokens")
			.setDesc("Maximum number of tokens the model can output")
			.addText((text) => {
				text.setPlaceholder("32768")
					.setValue(maxOutputTokens.toString())
					.onChange((value) => {
						const parsed = parseInt(value);
						if (!isNaN(parsed) && parsed > 0) {
							maxOutputTokens = parsed;
						}
					});
			});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText("Cancel")
					.onClick(() => {
						this.close();
					});
			})
			.addButton((btn) => {
				btn.setButtonText("Add Model")
					.setCta()
					.onClick(() => {
						if (!modelId || !displayName) {
							// Could add a notice here for validation
							return;
						}
						
						this.onSubmit({
							id: modelId,
							displayName: displayName,
							provider: provider,
							maxOutputTokens: maxOutputTokens,
						});
						this.close();
					});
			});
	}

	override onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
