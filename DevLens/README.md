# DevLens — Developer & Designer HUD, Code Utilities & Micro-Break

DevLens is a Chrome Extension for web developers and UI/UX designers, featuring a live element CSS inspector, color token sampler, developer text transformers, interactive cheat sheets, and a micro-break code quiz game.

---

## Direct Download & Installation

### Direct ZIP Download
Download the pre-packaged extension ZIP:
- **Direct Download Link**: [DevLens-v1.0.0.zip](https://github.com/heyysvm/Chrome-Extensions-/raw/main/DevLens-v1.0.0.zip)

### Installation Steps:
1. Download and extract [DevLens-v1.0.0.zip](https://github.com/heyysvm/Chrome-Extensions-/raw/main/DevLens-v1.0.0.zip).
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** to **ON** in the top-right corner.
4. Click **Load unpacked** (top left) and select the extracted `DevLens` folder.

---

## Key Features

- **Live CSS & Color Token Inspector**: Toggle the inspector on any website to hover over elements and view real-time CSS styles, background/text hex colors, font families, font sizes, and box dimensions. Click to save any color token directly to your palette.
- **Color Token Palette & CSS Exporter**: Store inspected colors and export your complete color palette as CSS custom properties (`:root { --color-1: ... }`) with 1-click copy.
- **Developer Code Utilities**:
  - `JSON Format`: Indent and format JSON strings.
  - `Base64 Encode & Decode`: Convert strings to and from Base64.
  - `URL Encode`: Encode parameters for API queries.
- **Interactive Cheat Sheets**: Instant 1-click copy reference cards for:
  - `Git`: Common Git commands (`status`, `commit`, `checkout`).
  - `CSS Flexbox`: Flexbox alignment properties (`justify-content`, `align-items`).
  - `HTTP Status Codes`: Common status response codes (`200`, `201`, `400`, `401`, `404`).
  - `Regex`: Common regular expressions for email, URLs, and numeric strings.
- **Micro-Break Dev Quiz Game**: Interactive 60-second code quiz game with score tracking to take fun work breaks.
- **Frameless Floating PIP Notepad**: Launch a Picture-in-Picture floating notepad that stays on top of desktop apps for taking notes or testing code snippets.

---

## Technical Specifications

- Manifest V3 (Google Chrome)
- Vanilla JavaScript ES6+
- HTML5 / CSS3 Glassmorphism UI
- Document Picture-in-Picture API
