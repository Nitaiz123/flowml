# FlowML Redesign — TechCrunch Style

## Reference
TechCrunch (techcrunch.com): white background, black text, tight editorial grid, small red accent, no gradients, no dark mode, clean sans-serif, generous whitespace, content-first.

## Chosen Approach: Editorial Precision

**Design Movement:** Swiss/International Typographic Style meets modern SaaS editorial (TechCrunch, Linear, Vercel docs)

**Core Principles:**
1. White canvas — #FFFFFF background everywhere, no dark panels
2. Black ink — #0A0A0A primary text, near-black for headings
3. One accent — #E8000D (TechCrunch red) used sparingly for CTAs and active states only
4. Borders over shadows — 1px solid #E5E5E5 dividers, no box-shadows

**Color Philosophy:**
- Background: #FFFFFF
- Surface: #F9F9F9 (very light gray for cards/panels)
- Border: #E5E5E5
- Text primary: #0A0A0A
- Text secondary: #6B6B6B
- Accent: #E8000D (red — used only for primary CTA, active node borders, run button)
- Code/mono: #1A1A1A on #F4F4F4

**Layout Paradigm:**
- Horizontal rule-based sections (like newspaper columns)
- Left-aligned headlines, never centered
- Pipeline builder: white canvas with very light gray dot grid, clean colored node type tags

**Typography System:**
- Headings: "Inter" 700/800 weight, tight letter-spacing (-0.02em)
- Body: "Inter" 400/500, 15px, line-height 1.6
- Mono: "JetBrains Mono" for node names, code, logs

**Brand Voice:** Direct, technical, zero fluff.

**Signature Brand Color:** #E8000D (editorial red)

---

## OLD Design (replaced)

## Three Approaches

### 1. Terminal Noir
Dark, monochromatic developer tool aesthetic. Monospace fonts, green-on-black accents, grid lines. Feels like a professional IDE.
**Probability:** 0.04

### 2. Blueprint Engineering
Dark navy background with electric blue/cyan accents. Technical blueprint aesthetic — grid dots, precise lines, engineering precision. Nodes look like circuit components.
**Probability:** 0.08

### 3. Obsidian Studio
Deep charcoal/slate dark theme with amber/orange accent. Clean, modern, premium developer tool. Inspired by tools like Linear and Vercel. Asymmetric sidebar layout, sharp typography.
**Probability:** 0.03

---

## Chosen Approach: Blueprint Engineering

### Design Movement
Technical Blueprint / Engineering Precision — inspired by CAD tools, circuit diagrams, and infrastructure dashboards.

### Core Principles
1. **Dark-first, high contrast** — deep navy (#0a0f1e) background, electric cyan (#00d4ff) accents
2. **Grid-based canvas** — subtle dot grid on the pipeline canvas, reinforcing the "engineering workspace" feel
3. **Precision over decoration** — sharp edges, monospace type for code/logs, no unnecessary ornamentation
4. **Information density done right** — sidebar shows node palette, canvas is the workspace, bottom panel shows logs

### Color Philosophy
- Background: `#0a0f1e` (deep navy)
- Canvas: `#0d1526` (slightly lighter navy)
- Accent primary: `#00d4ff` (electric cyan) — used for active nodes, connections, CTAs
- Accent secondary: `#7c3aed` (violet) — used for ML/model nodes
- Success: `#10b981` (emerald) — running/success states
- Warning: `#f59e0b` (amber) — pending/warning states
- Error: `#ef4444` (red) — failed states
- Text: `#e2e8f0` (slate-200) primary, `#64748b` (slate-500) muted

### Layout Paradigm
Three-panel layout:
- **Left sidebar** (240px): Node palette organized by category (Data, Transform, Train, Evaluate, Deploy)
- **Center canvas** (flex): The drag-and-drop pipeline canvas with dot grid
- **Right panel** (320px, collapsible): Node configuration when a node is selected
- **Bottom panel** (200px, collapsible): Execution logs and run history

### Signature Elements
1. **Glowing node connections** — SVG bezier curves with cyan glow effect
2. **Node status badges** — colored dot indicators (idle/running/success/error)
3. **Dot grid canvas background** — subtle engineering graph paper feel

### Interaction Philosophy
Nodes snap to grid. Connections draw on drag from output port to input port. Selected nodes highlight with cyan border glow. Running nodes pulse with animation.

### Animation
- Node drag: 0ms (instant, no lag)
- Connection draw: real-time SVG path update
- Node status change: 200ms fade transition
- Panel open/close: 250ms ease-out slide
- Running node pulse: 2s infinite subtle glow animation

### Typography System
- Display/headings: `JetBrains Mono` (monospace, technical)
- Body: `Inter` (clean, readable)
- Code/logs: `JetBrains Mono` (monospace)

### Brand Essence
**FlowML** — The visual ML pipeline builder for engineers who hate YAML. Precise. Fast. Yours.
Personality: Technical, Confident, Pragmatic

### Brand Voice
Headlines: "Build ML pipelines that actually run."
CTA: "Start building →"
No filler like "Welcome" or "Get started today"

### Signature Brand Color
Electric Cyan `#00d4ff`
