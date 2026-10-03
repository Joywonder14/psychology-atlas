# Psychology for Social Science

[中文说明](README.zh-CN.md)

**[Open the interactive knowledge base](https://psychology-atlas-joywonder.stx8wpytbp.chatgpt.site)**

An interactive psychology knowledge base for social science researchers. Explore psychological theories, models, processes, effects, and concepts through study cards, textbook references, keyword search, and a network of related ideas.

The project supports sustained learning and the development of ideas for social science research. Cards are currently written in Chinese, with English terminology and searchable aliases. Project documentation is available in English and Chinese.

**Current snapshot (October 3, 2026):** 527 cards · 8 domains · 5 textbooks · 81 chapter entries · 860 connections · 10 thematic collections.

## Explore the knowledge base

- Browse broad domains and subfields, then open individual knowledge cards.
- Search Chinese and English terms, aliases, keywords, and explanatory phrases.
- Follow connections between cards and explore thematic collections across domains.
- Trace cards back to textbook chapters and source locations.
- Read or download the complete Markdown archive for use outside the website.

The interface and study-card content are primarily in Chinese. English terms help readers identify concepts and find them in the source literature.

## Start reading

**Online:** [open the public website](https://psychology-atlas-joywonder.stx8wpytbp.chatgpt.site) in your browser. No download or installation is needed.

**On GitHub:** browse the [individual cards](knowledge/cards/) or read the [complete Markdown archive](backups/心理学知识库.md).

**Offline:** choose **Code → Download ZIP**, extract the archive, and open `dist/index.html` in a browser. Browsing, search, the concept network, and Markdown export work offline. GitHub's HTML file preview displays the source code; use the online link above or download the file to use the interface.

The prebuilt website works offline in a browser and does not send reading activity to an external AI service.

## Build and maintain

Edit the Markdown cards, then rebuild the website and archive:

```sh
python3 tools/build.py
```

The build uses only the Python standard library. To check card references, chapter mappings, relationships, search behavior, and the archive, run the existing checks with Node.js:

```sh
node tools/check.js
```

For a local editing preview that rebuilds when source files change:

```sh
python3 tools/serve.py
```

On macOS, the included `启动知识库.command` launcher also starts the local preview.

## Repository structure

| Location | Contents |
| --- | --- |
| [`knowledge/cards/`](knowledge/cards/) | Editable Markdown cards and their metadata |
| [`knowledge/catalog.json`](knowledge/catalog.json) | Domain definitions and textbook bibliography |
| [`knowledge/chapters.json`](knowledge/chapters.json) | Chapter-to-card mappings |
| [`knowledge/relations.json`](knowledge/relations.json) | Connections between cards and explanations of those connections |
| [`knowledge/collections.json`](knowledge/collections.json) | Collections spanning multiple domains |
| [`knowledge/细化复核.json`](knowledge/细化复核.json) | Records of the detailed organization of this version |
| [`app/`](app/) | HTML, CSS, and JavaScript source |
| [`dist/index.html`](dist/index.html) | The generated website, ready to open offline |
| [`backups/心理学知识库.md`](backups/心理学知识库.md) | The complete Markdown archive, regenerated during each build |
| [`tools/`](tools/) | Build, preview, validation, and initial-import utilities |

Card metadata is stored between the opening `---` delimiters. Each field occupies one line; complex values use JSON arrays. Keep an existing card's ID stable because chapters, collections, and connections refer to it.

## Sources and interpretation

This is a learning resource developed with AI assistance, based on five textbooks listed in the [catalog](knowledge/catalog.json). Each card includes source locations. Original textbook files are kept outside the repository and are not distributed here.

The cards paraphrase selected theories, models, processes, effects, concepts, and methods from the textbooks. Coverage includes core material selected from the teaching chapters and the applied social psychology modules; it does not claim to capture every term or replace the books' arguments. Prefaces, acknowledgments, bibliographies, and indexes do not generate separate cards.

PDF references use the page order in the source file, which can differ from printed page numbers. EPUB references use chapters, subsections, and anchors. Illustrative examples are written to aid understanding. Notes on interpretation preserve qualifications and limitations discussed in the sources.

Some cards include leads to studies mentioned in the textbooks. These are textbook-based references, not a claim that the original papers have been independently reviewed. Check the cited sources before using a card to support a research claim.

Card types are editorial labels that can overlap; they do not rank the strength of evidence. Connections in the network represent conceptual relationships, not established causal relationships. A card may appear in multiple thematic collections. Search retrieves relevant cards using their text and metadata; it does not generate answers.

## Additions and corrections

Use the [card template](knowledge/卡片模板.md) when adding material. Include a source location and a stable ID, update the chapter mappings, connections, and collections as appropriate, then rebuild and run the checks above.

To report a correction, open an issue with the card ID, the relevant source location, and the proposed change.

`tools/curate.py` and `tools/import_cards.py` were used for the initial import. Routine maintenance should edit the Markdown cards directly; rerunning an old import can overwrite later edits.
