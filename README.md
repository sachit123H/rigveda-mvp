# Digital Library of Indic Intellectual History (DLIIH) — Rigveda MVP

DLIIH is a modern, open-access digital humanities platform dedicated to creating a standardized, richly annotated, and interoperable corpus of the earliest layers of Indic thought. 

This repository houses the Phase 1 MVP—a **Deep Vertical Slice of the Rigveda Samhitā (Mandala 1, Sukta 1)**, implementing the **Layered Disclosure Model** to bring academic rigor and modern Human-Computer Interaction (HCI) standards to ancient Sanskrit literature.

---

## 🎨 Visual Preview

The platform combines premium scholastic paper aesthetics with warm amber and charcoal tones, featuring custom-generated Vedic artwork and interactive widgets:

*   **Landing Page**: Showcases the 5-year chronological project timeline, academic value propositions, and raw TEI/XML markup showcases.
*   **Corpus Viewer**: Features a split-pane interface (Reading Canvas & Philological Inspector) built for responsive devices.

---

## 🚀 Key Features

### 1. The Layered Disclosure Model
Traditional digital texts often overwhelm readers with large blocks of Sanskrit, multiple English translations, and separate tables of grammatical footnotes. DLIIH presents:
*   **The Default View**: An uncluttered, distraction-free environment containing only the svara-accented **Samhitapatha** Devanagari text sitting directly above its fluid English translation.
*   **The Philological Inspector**: Clicking any Sanskrit word in the verse immediately opens a sidebar (on desktop) or bottom drawer (on mobile) showing its un-sandhied **Padapatha** break, root **Lemma**, **Grammar Matrix** (gender, case, number, tense, conjugation), and **Literal translation**.

### 2. Traditional Apparatus
Beneath the main canvas resides a toggleable tabbed container displaying:
*   **Sāyaṇācārya's Bhāṣya**: Sāyaṇa's legendary 14th-century Sanskrit commentary linked directly to the active mantra.
*   **Mantra Metadata**: Grammatical and structural details including the Rishi (sage), Devatā (deity), and Chandas (poetic meter).
*   **License Info**: Details regarding open-access publication.

### 3. Live Demo Sandbox
The landing page includes a mini interactive playground displaying Mantra 1.1.1. Users can experience the Layered Disclosure inspector instantly without opening the full corpus viewer.

### 4. Vedic Scholar AI Chatbot
A floating AI chat assistant styled with a stone/gold interface, configured to handle context-specific queries about Rigveda 1.1 (such as translating Sanskrit roots, explaining Sāyaṇācārya's interpretations, or reviewing the Gayatri meter structure).

### 5. Standardized TEI/XML Foundations
The underlying data is designed to conform to Text Encoding Initiative (TEI) standards, structuring Sanskrit word tokens with morphological analysis tags. A dedicated toggle on the homepage displays both the raw **TEI/XML markup** and its parsed **JSON payload**.

---

## 🛠️ Technical Stack

*   **Framework**: Next.js 16.2.6 (React 19) using the App Router.
*   **Bundler**: Turbopack for lightning-fast development.
*   **Styling**: Tailwind CSS v4.
*   **Language**: TypeScript.
*   **Typography**: Google Fonts integrated natively via CSS theme variables:
    *   `Inter` (sans-serif) for toolbars and grammatical sidebar data.
    *   `Crimson Pro` (serif) for translation prose and titles.
    *   `Noto Sans Devanagari` (Sanskrit) to perfectly render Vedic pitch accents (svaras).

---

## 📂 Project Directory Structure

```text
├── app/
│   ├── api/chat/route.ts                     # Chatbot response engine API
│   ├── components/
│   │   └── Chatbot.tsx                       # Floating Scholar AI Chatbot
│   ├── texts/rigveda/[mandala]/[sukta]/
│   │   └── page.tsx                          # Interactive Rigveda Viewer
│   ├── globals.css                           # Color variables, fonts, scrollbars
│   ├── layout.tsx                            # Fonts preloading & hydration fixes
│   └── page.tsx                              # DLIIH Landing Page, Sandbox & XML views
├── data/
│   └── rv_1_1.json                           # Rigveda Mandala 1 Sukta 1 parsed JSON
├── public/
│   ├── vedic_yajna_hero.png                  # Generated homepage graphic
│   └── next.svg, vercel.svg, etc.            # Framework assets
├── package.json                              # Project dependencies & scripts
├── tsconfig.json                             # TypeScript settings
└── Walkthrough_1                             # Detailed dev log & build walkthroughs
```

---

## ⚡ Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v18.x or higher) and **npm** installed on your system.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/sachit123H/rigveda-mvp.git
cd rigveda-mvp
npm install
```

### 3. Run Development Server
Start the local development server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser to view the homepage.

### 4. Build Production Bundle
To compile and optimize the app for production:
```bash
npm run build
```

---

## 📜 Dataset & Licensing
*   **Sanskrit Source**: Rigveda Samhita (Mandala 1, Sukta 1) — Public Domain.
*   **Commentaries**: Sāyaṇa-bhāṣya (14th century) — Public Domain.
*   **English Translation**: Prepared by Sachit Varshney, licensed under Creative Commons Attribution-ShareAlike 4.0 International (**CC-BY-SA-4.0**).
*   **Code License**: Open-source under the MIT License.
