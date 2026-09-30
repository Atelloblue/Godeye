# AGENTS.md - Design Constraints & Project Architecture Guidelines

This file defines the project design system, visual standards, component architecture, and operational constraints for the **God's Eye Tactical Reconnaissance & Geospatial Command App**.

---

## 1. Visual Aesthetics & Design System

### Core Palette: Dark Tactical Command Center
- **Canvas / Map Layer**: High-resolution dark vector imagery (CartoDB Dark, ESRI Satellite, Topographic, Hybrid).
- **Primary Surface**: `#1c1c1c` at 95% opacity (`bg-[#1c1c1c]/95`) with subtle backdrop blur (`backdrop-blur-md`).
- **Header & Section Panels**: `#181818` with 90% opacity (`bg-[#181818]/90`).
- **Cards & Inset Surfaces**: `#141414` (`bg-[#141414]`) with subtle borders (`border-[#262626]`).
- **Interactive Controls & Buttons**: `#282828` base (`bg-[#282828]`), hover state `#333333` (`hover:bg-[#333333]`), with border `#383838` (`border-[#383838]`).

### Typography & Colors
- **Font Stack**: Clean, modern sans-serif (`font-sans`) for legibility across map layers. Monospace font (`font-mono`) is reserved strictly for numeric telemetry data (coordinates, speeds, altitudes, callsigns).
- **Text Color Hierarchy**:
  - Primary Headers / Titles: `text-zinc-100` (`#f4f4f5`)
  - Subheaders / Value Labels: `text-zinc-200` (`#e4e4e7`) / `text-zinc-300` (`#d4d4d8`)
  - Muted Metadata / Subtitles: `text-zinc-400` (`#a1a1aa`)
  - Placeholder & Secondary Text: `text-zinc-500` (`#71717a`)

### Anti-Slop & Banned Visual Patterns
- **No Neon Accents**: Do NOT use neon cyan, electric green, bright purple, or saturated emerald accents for standard buttons or text.
- **No Popups or Modal Overlays**: Avoid disruptive popups, full-screen image expansion modals, or jarring modal takeovers for information display. Keep all briefing content inline within compact, draggable cards.
- **No Glow FX / Glassmorphism Overuse**: Do NOT add heavy drop shadows, neon glow rings, or saturated gradient text.
- **Radius & Borders**:
  - Floating Panels / Cards: Outer radius `rounded-2xl` (16px) with `border border-[#2e2e2e]`.
  - Inner Containers / Action Items: Inner radius `rounded-xl` (12px) with `border border-[#282828]`.
  - Buttons & Inputs: Radius `rounded-lg` (8px) or `rounded-full` for search pills.

### Copywriting & Vocabulary Constraints
- **No Filler Buzzwords**: Strictly **BAN** empty filler words, exaggerated tech jargon, or sci-fi clichés in UI headers, button labels, card titles, tooltips, and voice responses.
  - **Banned Words**: `"matrix"`, `"intel"`, `"cyber"`, `"next-gen"`, `"synergy"`, `"hyper"`, `"futuristic"`, `"quantum"`, `"supercharge"`, `"empower"`.
  - **Approved Replacement Terms**:
    - Instead of `"Wikipedia Intel"` -> Use `"Wikipedia Summary"` or `"Wikipedia Brief"`.
    - Instead of `"Camera Matrix"` or `"CCTV Matrix"` -> Use `"Camera Grid"` or `"Camera Wall"`.
    - Instead of `"Location Intel Card"` -> Use `"Location Details"` or `"Location Summary"`.
    - Instead of `"Target Telemetry Matrix"` -> Use `"Target Details"` or `"Target Telemetry"`.

---

## 2. Component Architecture & UI Layout

```
+-------------------------------------------------------------------+
|                        TacticalHeader.tsx                         |
|  [Logo & Title]   [Live Status Pills]   [Feed Counters & Settings] |
+-------------------------------------------------------------------+
|                                                                   |
|  +-----------------------+              +----------------------+  |
|  | LayerControlPanel.tsx |              | TargetTelemetry      |  |
|  | (Draggable Panel)     |              | Drawer.tsx           |  |
|  | - Search Bar          |              | (Draggable Drawer)   |  |
|  | - Base Map Chips      |              | - Selected Target    |  |
|  | - Layer Toggles       |              | - Live Coordinates   |  |
|  +-----------------------+              | - Wikipedia Intel    |  |
|                                         +----------------------+  |
|                            MAP CANVAS                             |
|                           (Leaflet.js)                            |
|                                                                   |
|  +-----------------------+              +----------------------+  |
|  | LocationIntelCard.tsx |              | WikipediaIntelCard   |  |
|  | (GPS & Nearest CCTV)  |              | (Draggable Briefing) |  |
|  +-----------------------+              +----------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
|                     VoiceCommandSpark.tsx (Floating Audio)        |
+-------------------------------------------------------------------+
```

### Component Guidelines

1. **`TacticalHeader.tsx`**:
   - Fixed at top (`top-0`), full width (`w-full`), dark translucent surface (`bg-[#181818]/90 border-b border-[#282828]`).
   - Displays system time, active target count, data stream status indicators, and quick action modals (CCTV Wall, Audit, Settings).

2. **`LayerControlPanel.tsx`**:
   - Draggable floating panel on the left side of the map canvas.
   - Contains the unified search bar (`placeholder="Search Texas, city, building, topic..."`), base layer selection chips (Satellite, Dark Tactical, Topographic, Hybrid), and toggleable feature layers (Aircraft, Ships, Cameras, Weather, Fires, Bikes, Buses).

3. **`TargetTelemetryDrawer.tsx`**:
   - Draggable right-side drawer appearing when a flight, vessel, CCTV camera, or location is clicked.
   - Displays real-time telemetry (Coordinates, DMS, Speed, Altitude, Heading, Timezone, Nearest CCTV) with an inline **"Wikipedia Brief & Overview"** button.

4. **`WikipediaIntelCard.tsx`**:
   - Draggable bottom-right briefing card displaying Wikipedia topic summary, inline featured image, audio briefing player (*"Listen Briefing"*), and map teleport button.
   - Must fit seamlessly into the dark command center styling without neon colors or popups.

5. **`VoiceCommandSpark.tsx`**:
   - Floating mic spark overlay for voice commands ("Tell me about Texas", "Switch to satellite", "Fly to Houston").
   - Integrates speech synthesis (`speakVoiceResponse`) and toast feedback.

---

## 3. Interaction & Functionality Rules

- **Draggable UI Panels**: All floating cards use the `useDraggable` hook with a top drag handle (`data-drag-handle` with `GripHorizontal` icon).
- **Map Teleportation & Polygon Highlights**: Whenever a user searches or asks about a state, city, landmark, or building (e.g. Texas, Houston, White House), resolve its geographic polygon boundary via `resolveHighlightWithShape` and highlight it on the map while animating the camera.
- **Audio Feedback**: Voice responses use Web Speech Synthesis with clean, non-disruptive audio tone chimes (`playTone('success')`).
- **Storage & State**: App settings (units, poll rates, API keys) and pinned CCTV camera IDs are stored in `localStorage`.

---

## 4. File Structure Reference

```
/src
  ├── App.tsx                     # Main application layout & state orchestrator
  ├── main.tsx                    # Entry point
  ├── types.ts                    # Global TypeScript interfaces & types
  ├── components/                 # Modular React UI components
  │   ├── GodsEyeMap.tsx          # Leaflet map container & layer renderer
  │   ├── TacticalHeader.tsx      # Top status bar & controls
  │   ├── LayerControlPanel.tsx   # Search & layer toggle panel
  │   ├── TargetTelemetryDrawer.tsx # Selected target telemetry card
  │   ├── WikipediaIntelCard.tsx  # Dark briefing card for Wikipedia topics
  │   ├── LocationIntelCard.tsx   # User GPS & nearest CCTV auto-connect HUD
  │   ├── VoiceCommandSpark.tsx   # Voice command recognition & AI spark
  │   ├── CCTVStreamViewer.tsx    # Multi-camera matrix wall modal
  │   ├── CCTVImage.tsx           # Resilient image loader with proxies
  │   ├── DataAuditModal.tsx      # Feed status diagnostic modal
  │   ├── SettingsModal.tsx       # System preferences modal
  │   └── RadarTimelineHUD.tsx    # Weather radar player HUD
  └── utils/                      # Helper modules & API clients
      ├── wikiApi.ts              # Wikipedia REST API client
      ├── geoBoundaries.ts        # City/State/Building boundary polygon solver
      ├── geoUtils.ts             # Haversine distance & spatial calculations
      ├── openSkyApi.ts           # OpenSky live aircraft feed
      ├── aisStreamApi.ts         # Live AIS maritime vessel client
      ├── cctvFeeds.ts            # DOT CCTV stream database
      ├── weatherFiresApi.ts      # RainViewer radar & NASA FIRMS fire client
      ├── gbfsApi.ts              # Bike share GBFS feeds
      └── gtfsRtApi.ts            # Transit GTFS-RT feed client
```
