# INSTRUCTIONS.md - Design System & UI Specifications

This document outlines all design constraints, color schemes, typography, component behaviors, and UI patterns for the **God's Eye Tactical Reconnaissance & Command Center** application.

---

## 🎨 Visual Design Constraints

### 1. Color Palette (Dark Tactical Theme)
- **Application Background**: Dark tactical map canvas (CartoDB Dark Vector, ESRI Satellite, Topographic).
- **Floating Panel Surfaces**: `#1c1c1c` with 95% opacity (`bg-[#1c1c1c]/95 backdrop-blur-md`).
- **Header & Section Bars**: `#181818` with 90% opacity (`bg-[#181818]/90 border-b border-[#282828]`).
- **Cards & Data Boxes**: `#141414` (`bg-[#141414] border border-[#262626]`).
- **Buttons & Interactive Elements**: Dark zinc base `#282828` (`bg-[#282828]`), hover `#333333` (`hover:bg-[#333333]`), border `#383838` (`border-[#383838]`).
- **Text Styling**:
  - Main Headings: `text-zinc-100` (`#f4f4f5`)
  - Subtitles & Labels: `text-zinc-200` (`#e4e4e7`) / `text-zinc-300` (`#d4d4d8`)
  - Secondary / Muted Text: `text-zinc-400` (`#a1a1aa`)
  - Placeholders & Hints: `text-zinc-500` (`#71717a`)

### 2. Styling Rules & Banned Patterns
- **No Saturated Neon Colors**: Do NOT use neon cyan, electric green, bright purple, or saturated emerald highlights on buttons or card text.
- **No Popups or Modal Overlays**: Avoid modal dialog takeovers or popups for information display (such as image expansion modals or full-screen overlays). Keep all content inline inside compact, draggable cards.
- **No Excessive Glassmorphic Glow**: Do NOT use glowing drop-shadows or saturated gradient fills.
- **Borders & Corner Radii**:
  - Outer Card Containers: `rounded-2xl` (16px) with 1px border `border-[#2e2e2e]`.
  - Inner Elements: `rounded-xl` (12px) with `border-[#282828]`.
  - Buttons & Inputs: `rounded-lg` (8px) or `rounded-full` for search inputs.

### 3. Copywriting & Vocabulary Rules
- **No Filler Buzzwords**: Strictly **BAN** empty filler words, exaggerated tech jargon, or sci-fi clichés in UI headers, button labels, card titles, tooltips, and voice responses.
- **Banned Words**: `"matrix"`, `"intel"`, `"cyber"`, `"next-gen"`, `"synergy"`, `"hyper"`, `"futuristic"`, `"quantum"`, `"supercharge"`, `"empower"`.
- **Approved Replacements**:
  - Instead of `"Wikipedia Intel"` -> Use `"Wikipedia Summary"` or `"Wikipedia Brief"`.
  - Instead of `"CCTV Matrix"` -> Use `"Camera Grid"` or `"Camera Wall"`.
  - Instead of `"Location Intel Card"` -> Use `"Location Details"` or `"Location Summary"`.
  - Instead of `"Telemetry Matrix"` -> Use `"Target Details"` or `"Target Telemetry"`.

---

## 📐 Layout & Component Hierarchy

### 1. `TacticalHeader.tsx` (Top Status Bar)
- **Location**: Fixed top navigation bar.
- **Contents**: Brand title, real-time UTC clock, active data feed counters (Flights, Vessels, Cameras, Transit), and trigger buttons for CCTV Wall, Data Audit, and Settings.

### 2. `LayerControlPanel.tsx` (Left Control Panel)
- **Location**: Floating draggable panel on the left side.
- **Contents**:
  - Search bar (`placeholder="Search Texas, city, building, topic..."`).
  - Base map selector chips (Satellite, Dark Tactical, Topographic, Hybrid).
  - Layer visibility toggles (Flights, Ships, CCTV, Weather Radar, Fires, Micro-Mobility, Transit).

### 3. `TargetTelemetryDrawer.tsx` (Right Telemetry Drawer)
- **Location**: Floating draggable drawer on the right side.
- **Contents**:
  - Target callsign/vessel/camera title and icon.
  - Latitude, Longitude, DMS coordinates, Local Time, Speed, Altitude, and Heading.
  - Inline **"Wikipedia Brief & Overview"** trigger button.

### 4. `WikipediaIntelCard.tsx` (Bottom-Right Briefing Card)
- **Location**: Floating draggable card at bottom-right.
- **Contents**:
  - Top drag handle (`data-drag-handle`) with `GripHorizontal` icon and close button.
  - Article title and category subtitle in dark zinc typography.
  - Inline thumbnail image (no popups).
  - Clean summary extract text in `#141414` inset box.
  - Audio speech synthesis toggle (*"Listen Briefing"* / *"Stop Audio"*) and link to full Wikipedia article.

### 5. `VoiceCommandSpark.tsx` (Voice Command Spark)
- **Location**: Floating audio spark indicator.
- **Supported Intent Categories**:
  - **Information & Wiki Queries**: *"Tell me about Texas"*, *"Tell me about Houston"*, *"What is the White House?"*, *"Explain [Topic]"*.
  - **Base Layer Commands**: *"Switch to satellite"*, *"Change to dark tactical"*, *"Topographic mode"*.
  - **Navigation & Teleport**: *"Fly to Dallas"*, *"Teleport to London"*, *"Show me Austin"*.
  - **Layer Toggles**: *"Toggle flights"*, *"Hide traffic"*, *"Show CCTV cameras"*.

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: React 18+ with Vite & TypeScript.
- **Map Library**: Leaflet (`leaflet` & `react-leaflet`) with custom dark vector tiles.
- **Styling**: Tailwind CSS utility classes.
- **Icons**: `lucide-react` (Plane, Ship, Video, Search, BookOpen, Volume2, MapPin, GripHorizontal, etc.).
- **Voice Recognition**: Web Speech API (`webkitSpeechRecognition`) + SpeechSynthesis.
- **Persistence**: `localStorage` for user preferences, map settings, and pinned CCTV camera IDs.
