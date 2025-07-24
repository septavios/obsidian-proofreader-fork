# Proofreader (Enhanced Fork)
![GitHub download count](https://img.shields.io/github/downloads/septavios/obsidian-proofreader-fork/total?label=GitHub%20Downloads&style=plastic)
![Last release](https://img.shields.io/github/v/release/septavios/obsidian-proofreader-fork?label=Latest%20Release&style=plastic)

AI-based proofreading and stylistic improvements for your writing. Changes are
inserted as suggestions directly in the editor, similar to the suggested changes
feature in word processing apps.

**🚀 This enhanced fork includes:**
- **Custom model support** with easy-to-use UI
- **Smart proofreading modes** (Quick Fix, Balanced, Style Improvement, Academic, Creative)
- **Severity levels** (Minor, Moderate, Major corrections)
- **Apply functions** for direct text replacement without suggestions
- **Enhanced visual styling** with improved CSS and animations
- **Built-in qwen-plus model** support

<img alt="Showcase" width=70% src="https://github.com/user-attachments/assets/fa77eb97-61b9-4102-b8b2-e7c385868363">

## Table of contents

<!-- toc -->

- [Features](#features)
- [New Features in This Fork](#new-features-in-this-fork)
- [Installation & setup](#installation--setup)
	* [Plugin installation](#plugin-installation)
	* [Get an OpenAI API key](#get-an-openai-api-key)
	* [Custom Models Setup](#custom-models-setup)
- [Usage](#usage)
	* [Basic Proofreading](#basic-proofreading)
	* [Smart Proofreading Modes](#smart-proofreading-modes)
	* [Apply Functions](#apply-functions)
- [Visual appearance of the changes](#visual-appearance-of-the-changes)
- [Testimonials](#testimonials)
- [Plugin development](#plugin-development)
	* [General](#general)
	* [Adding support for new LLMs](#adding-support-for-new-llms)
- [About the developer](#about-the-developer)

<!-- tocstop -->

## Features
- Suggested changes are inserted directly into the text: Additions as
  `==highlights==` and removals as `~~strikethroughs~~`.
- Accept or reject changes with just one hotkey.
- Easy to use: No complicated plugin settings and AI parameters to configure.
- **NEW**: Custom model support for any OpenAI-compatible API
- **NEW**: Smart proofreading modes tailored for different writing styles
- **NEW**: Apply functions for immediate text correction
- **NEW**: Enhanced visual styling with animations and hover effects

|                                       | Professional proofreading service               | Proofreader plugin                                                           |
| ----------------------------------    | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Cost for English text of 10,000 words | ~ $400, depending on the service                | ~ \$0.01 – $0.06[^1]                                                         |
| Completion duration                   | up to 3 work days                               | about 5 minutes                                                              |
| Input format                          | usually Microsoft Word (`.docx`)                | Markdown file in Obsidian                                                    |
| Method of incorporating changes       | mostly mouse clicks                             | keyboard shortcuts                                                           |
| Additional benefits                   | Editor makes general comments on writing style. | Plugin can also be used to quickly proofread single sentences or paragraphs. |

[^1]: Estimated pricing for the [GPT 4.1 nano
	model](https://platform.openai.com/docs/models/) in April 2025. The plugin
	developer is not responsible if the actual costs differ. You can track your
	usage costs [on this page](https://platform.openai.com/usage).

> [!NOTE]
> This plugin supports **OpenAI API** and **custom OpenAI-compatible APIs** and incurs costs based on
> usage. Network requests are made when running the proofreading command.

## New Features in This Fork

### 🎯 Smart Proofreading Modes
Choose from different proofreading approaches:
- **Quick Fix**: Fast corrections for obvious errors
- **Balanced**: Standard proofreading with moderate improvements
- **Style Improvement**: Focus on enhancing writing style and flow
- **Academic**: Formal, precise language suitable for academic writing
- **Creative**: Preserve creative voice while improving clarity

### 📊 Severity Levels
Control the extent of corrections:
- **Minor**: Only fix clear errors, minimal changes
- **Moderate**: Standard corrections and improvements
- **Major**: Comprehensive rewriting and restructuring

### 🔧 Custom Model Support
- Add any OpenAI-compatible model through the settings UI
- Built-in support for popular models including qwen-plus
- Easy model management with add/remove functionality
- Support for custom API endpoints

### ⚡ Apply Functions
New commands for immediate text replacement:
- `Apply proofreading to selection/paragraph` - Direct corrections without suggestions
- `Apply proofreading to full document` - Immediate document-wide corrections

### 🎨 Enhanced Visual Styling
- Improved CSS with smooth animations
- Theme-specific optimizations for light and dark modes
- Hover effects and tooltips for better user experience
- Professional appearance with rounded corners and shadows

## Installation & setup

### Plugin installation
1. Download the latest release from [GitHub Releases](https://github.com/septavios/obsidian-proofreader-fork/releases)
2. Extract the files to your Obsidian plugins folder: `.obsidian/plugins/obsidian-proofreader/`
3. Enable the plugin in Obsidian's Community Plugins settings

### Get an OpenAI API key
1. [Create an OpenAI account](https://auth.openai.com/create-account).
2. Go to [this site](https://platform.openai.com/api-keys), and click `Create
   new secret key`.
3. Copy the API key.
4. In Obsidian, go to `Settings → Proofreader` and paste your API key there.

### Custom Models Setup
1. Go to `Settings → Proofreader → Custom Models`
2. Click "Add Custom Model"
3. Enter:
   - **Model ID**: The model identifier (e.g., `qwen-plus`, `claude-3-sonnet`)
   - **Display Name**: How it appears in the dropdown
   - **Provider**: Select the appropriate provider
   - **API Endpoint** (if needed): Custom API endpoint URL
4. Click "Add Model"

> [!TIP]
> The usage costs should not be very high, nonetheless you can track them
> [on this page](https://platform.openai.com/usage).

## Usage

### Basic Proofreading
1. Use the command `Proofread selection/paragraph` to check the selected
   text. If there is no selection, the command will check the current paragraph.
	* Alternatively, you can also check the whole document with `Proofread full
	  document`. However, note that the quality of AI suggestions tends to
	  decrease when proofreading too much text at once.
2. The changes are automatically inserted.
3. Accept/reject changes with `Accept suggestions in selection/paragraph`
   and `Reject suggestions in selection/paragraph`.  
   Same as the proofreading command, the `accept` and `reject` commands affect
   the current paragraph if there is no selection. Alternatively, you can also
   only accept/reject the next suggestion after your cursor via `Accept next
   suggestion` and `Reject next suggestion`.

### Smart Proofreading Modes
1. Go to `Settings → Proofreader`
2. Select your preferred **Proofreading Mode**:
   - **Quick Fix**: For fast, obvious corrections
   - **Balanced**: Standard proofreading (default)
   - **Style Improvement**: Enhanced writing style
   - **Academic**: Formal, academic tone
   - **Creative**: Preserve creative voice
3. Choose **Severity Level**:
   - **Minor**: Minimal changes
   - **Moderate**: Standard corrections (default)
   - **Major**: Comprehensive improvements

### Apply Functions
For immediate corrections without review:
1. Use `Apply proofreading to selection/paragraph` for direct text replacement
2. Use `Apply proofreading to full document` for immediate document-wide corrections
3. Text is replaced instantly without showing suggestions

## Visual appearance of the changes
The plugin now includes enhanced CSS styling by default. The visual improvements include:
- Smooth animations for new suggestions
- Improved contrast and readability
- Hover effects with tooltips
- Theme-specific optimizations
- Professional rounded corners and shadows

For additional customization, you can still add CSS snippets:
([Manual: How to add CSS snippets.](https://help.obsidian.md/snippets))

```css
.cm-strikethrough {
	text-decoration-color: var(--color-red);
}

.cm-s-obsidian span.cm-highlight {
	background-color: rgba(var(--color-green-rgb), 35%);
}
```

## Testimonials

> I was paying $29 a month for type.ai until today, your plugin made me cancel
> the subscription, because the only feature I wanted from there was this inline
> granular diffing which no other app offered, until Proofreader.
> [@samwega](https://github.com/chrisgrieser/obsidian-proofreader/discussions/1#discussioncomment-12972780)

## Plugin development

### General

```bash
# Clone the repository
git clone https://github.com/septavios/obsidian-proofreader-fork.git
cd obsidian-proofreader-fork

# Install dependencies
npm install

# Build the plugin
npm run build
# or use the esbuild script
node .esbuild.mjs
```

### Key Files in This Fork
- **src/prompt-generator.ts**: Dynamic prompt generation for different modes and severity levels
- **src/providers/openai-compatible.ts**: Generic adapter for OpenAI-compatible APIs
- **src/settings.ts**: Enhanced settings with custom model management
- **styles.css**: Enhanced visual styling with animations and theme support

### Adding support for new LLMs
This fork includes enhanced support for custom models:

1. **Easy Method**: Use the Custom Models UI in settings to add any OpenAI-compatible API
2. **Advanced Method**: 
   - Create a new adapter in [./src/providers/](./src/providers/)
   - Add the adapter to `PROVIDER_ADAPTER_MAP` in [./src/providers/model-info.ts](./src/providers/model-info.ts)
   - Add models to `MODEL_SPECS` in the same file
   - Add API key settings in [./src/settings.ts](./src/settings.ts)

### Contributing
This is an enhanced fork of the original [obsidian-proofreader](https://github.com/chrisgrieser/obsidian-proofreader) by Chris Grieser. 

**New features in this fork:**
- Custom model support with UI
- Smart proofreading modes and severity levels
- Apply functions for direct text replacement
- Enhanced visual styling and animations
- Built-in support for additional models

## Credits

### Original Developer
This plugin is based on the excellent work by **Chris Grieser**:
- [Original Repository](https://github.com/chrisgrieser/obsidian-proofreader)
- [Website](https://chris-grieser.de/)
- [ResearchGate](https://www.researchgate.net/profile/Christopher-Grieser)

### Fork Enhancements
Enhanced fork maintained by **septavios** with additional features and improvements:
- [Fork Repository](https://github.com/septavios/obsidian-proofreader-fork)

> [!TIP]
> If you find this enhanced fork useful, consider starring the repository and contributing to its development!
