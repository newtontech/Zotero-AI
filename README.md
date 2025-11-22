# Zotero AI Newton

[![zotero target version](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)

Zotero AI Newton brings a Bohrium-inspired knowledge workspace directly into Zotero. It lets you chat with a single item, attached PDFs, or an entire collection using your preferred LLM provider while keeping all data local to your library.

## Features

- **Local knowledge workspace**: multi-turn chat that remembers history and mirrors your current Zotero selection.
- **PDF-aware answers**: summarize and question PDFs linked to selected items.
- **Collection reasoning**: compare or combine insights across folders before sending prompts to an LLM.
- **Pluggable models**: supply OpenAI or DeepSeek API keys and models from the preferences pane.
- **Tone controls**: switch between concise, detailed, or creative responses without changing prompts.

## Installation

### Quick install (prebuilt 0.0.1-beta)

1. Download the signed XPI from the `release` folder (no build needed):
   - From this repository: [`release/zotero-ai-newton-0.0.1-beta.xpi`](release/zotero-ai-newton-0.0.1-beta.xpi)
   - Direct raw link: https://raw.githubusercontent.com/newtontech/Zotero-AI-Newton/main/release/zotero-ai-newton-0.0.1-beta.xpi
2. In Zotero, open **Tools → Add-ons**, choose **Install Add-on From File…**, and select the downloaded XPI.
3. Automatic beta updates are served from `release/update-beta.json`, so you can stay on the beta channel without rebuilding.

### Post-install setup

1. Open **Edit → Preferences → Zotero AI Newton**.
2. Paste your **OpenAI** or **DeepSeek** API key and preferred model.
3. Pick the default conversation scope (auto/item/collection) and response tone, then save.
4. Ensure Zotero can reach the internet so the plugin can call your chosen LLM provider.

### Build from source

1. Install Node.js LTS and a Zotero 7 build.
2. Clone this repository and install dependencies:
   ```sh
   npm install
   ```
3. Build the XPI package:
   ```sh
   npm run build
   ```
   The compiled add-on will appear under `.scaffold/build`.
4. In Zotero, open **Tools → Add-ons**, choose **Install Add-on From File…**, and select the generated XPI.

## Configuration

Open **Edit → Preferences → Zotero AI Newton** to provide API keys, default models, conversation scope (item, collection, or auto), and response tone. These settings stay local to Zotero and are used by the AI workspace pane and menu action.

## Usage

- Select one or more items or a collection and open the **AI Workspace** section in the item pane to review the current context.
- Click **Open chat surface** (or the item menu entry) to start a multi-turn conversation. The assistant will reference the active selection and any attached PDFs.
- Refresh the context snapshot whenever you change selections or folders.

## Development

- Hot reload during development:
  ```sh
  npm run start
  ```
- Lint and format checks:
  ```sh
  npm run lint:check
  ```
- Build before submitting changes:
  ```sh
  npm run build
  ```

Contributions that extend the AI workflows (better context gathering, richer prompts, additional model providers) are welcome.
