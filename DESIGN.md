# AI Video Clipper — Design System

## Brand & Style

This design system establishes a high-performance, developer-centric environment that blends the structural authority of a technical manual with the electric energy of a high-end IDE. It is designed to evoke precision, technical mastery, and intentionality.

The aesthetic follows a **Modern Cyber-Editorial** style. It utilizes an ultra-dark canvas to maximize focus, accented by high-voltage neon highlights that signify interactivity and system telemetry. The interface feels "overclocked" yet highly disciplined—relying on heavy whitespace, razor-sharp typography, and translucent obsidian layers that mimic a sophisticated digital terminal.

Key visual pillars include:
- **High-Density Focus:** Dark surfaces that reduce eye strain during prolonged technical sessions.
- **Neon Precision:** Functional color used exclusively for action, status, and navigation.
- **Structural Framing:** A subtle underlying grid that organizes information with mathematical rigor.

---

## Colors

The palette is optimized for a dark-first experience, prioritizing high contrast and legibility in low-light environments.

### Background & Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `#121414` | Main page background |
| `surface-dim` | `#121414` | Dimmed surface |
| `surface-bright` | `#383939` | Brighter surface variant |
| `surface-container-lowest` | `#0c0f0e` | Deepest container |
| `surface-container-low` | `#1a1c1c` | Low container |
| `surface-container` | `#1e2020` | Default container |
| `surface-container-high` | `#282a2a` | High container |
| `surface-container-highest` | `#333535` | Highest container |
| `background` | `#0B0A09` | Canvas / app background |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `on-surface` | `#e2e2e1` | Primary text |
| `on-surface-variant` | `#c6c9ab` | Secondary / muted text |
| `inverse-surface` | `#e2e2e1` | Text on dark backgrounds |
| `inverse-on-surface` | `#2f3130` | Text on light backgrounds |

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#DFFE00` | Neon Lime — CTAs, primary buttons, active focus |
| `on-primary` | `#2c3400` | Text on primary buttons |
| `primary-container` | `#d3f000` | Primary container background |
| `inverse-primary` | `#576400` | Primary on inverse backgrounds |
| `secondary` | `#39FF14` | Laser Green — success, completed, system health |
| `on-secondary` | `#053900` | Text on secondary |
| `secondary-container` | `#2ff801` | Secondary container |
| `tertiary` | `#ffffff` | White accent |
| `tertiary-container` | `#d9e3f6` | Tertiary container |

### System Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `error` | `#ffb4ab` | Error text |
| `error-container` | `#93000a` | Error background |
| `on-error` | `#690005` | Text on error |
| `outline` | `#909378` | Subtle borders |
| `outline-variant` | `#454932` | Hairline borders |
| `surface-tint` | `#b9d300` | Surface tint overlay |

### Neon Hairline Border

For subtle glowing structural definition:
```css
border: 1px solid rgba(223, 254, 0, 0.15);
```

---

## Typography

The typography system relies on a high-contrast mix of contemporary sans-serifs and technical monospaced fonts.

### Font Families

| Role | Font | Usage |
|------|------|-------|
| **Display & Headlines** | Be Vietnam Pro | Bold headlines, display text |
| **Body** | Inter | Long-form reading, interface copy |
| **Technical Metadata** | JetBrains Mono | Labels, tags, code snippets |

### Type Scale

| Token | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| `headline-xl` | Be Vietnam Pro | 72px | 900 | 80px | -0.05em |
| `headline-lg` | Be Vietnam Pro | 48px | 800 | 56px | -0.04em |
| `headline-md` | Be Vietnam Pro | 30px | 800 | 36px | -0.03em |
| `headline-sm` | Be Vietnam Pro | 24px | 700 | 32px | — |
| `headline-xl-mobile` | Be Vietnam Pro | 40px | 900 | 48px | -0.04em |
| `headline-lg-mobile` | Be Vietnam Pro | 32px | 800 | 40px | -0.03em |
| `body-lg` | Inter | 18px | 400 | 32px | — |
| `body-md` | Inter | 16px | 400 | 24px | — |
| `body-sm` | Inter | 14px | 400 | 20px | — |
| `label-caps` | JetBrains Mono | 12px | 700 | 16px | 0.25em |
| `label-mono` | JetBrains Mono | 13px | 500 | 18px | — |

---

## Layout & Spacing

### Grid System

- **Desktop:** 12-column grid, `max-width: 1280px`
- **Gutters:** Fixed at 20px
- **Mobile:** Single-column with 20px safe-area margins
- **Baseline unit:** 4px

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Micro spacing |
| `sm` | 8px | Tight component padding |
| `md` | 16px | Default component padding |
| `lg` | 24px | Section internal spacing |
| `xl` | 32px | Vertical section gaps |
| `2xl` | 48px | Large section gaps |
| `gutter` | 20px | Grid gutters |
| `margin-mobile` | 20px | Mobile safe margins |
| `margin-desktop` | 40px | Desktop margins |

### Layout Proportions

Favor asymmetric proportions to distinguish primary content from secondary utility:
- **Primary:Secondary** → 60/40 or 70/30 splits
- Central work content with side-aligned telemetry bars

---

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Glassmorphism**, rather than traditional shadows.

### Layer Stack

1. **Base Layer** — Obsidian Canvas (`#0B0A09`)
2. **Surface Layer** — Translucent Obsidian Panels:
   ```css
   background: rgba(22, 21, 20, 0.84);
   backdrop-filter: blur(24px);
   ```
3. **Accent Layer** — Components with Neon Hairline border to "pop"

### Shadows (when used)

Extremely diffused and low-opacity, acting as ambient occlusion:
```css
box-shadow: 0 24px 80px rgba(0, 0, 0, 0.60);
```

---

## Shapes

Balance industrial rigidity with "squircle" softness.

| Element | Radius | Usage |
|---------|--------|-------|
| Containers & Cards | `rounded-xl` (1.5rem) / `rounded-[2rem]` | Main structural panels |
| Buttons & Inputs | `rounded-lg` (1rem) | Interactive elements |
| Badges & Pills | `rounded-full` | Status indicators, nav pills |
| Small elements | `rounded-md` (0.75rem) | Chips, tags |

---

## Components

### Buttons

**Primary Button**
- Background: Solid Neon Lime (`#DFFE00`)
- Text: Obsidian (`#2c3400`)
- Hover: Shift to Laser Green (`#39FF14`) with slight translateY(-2px)
- Border radius: 1rem

**Secondary Button**
- Background: Transparent
- Border: 1px Steel (`#909378`)
- Hover: Border glows Neon Lime (`#DFFE00`)

**Ghost Button**
- Background: Transparent
- Text: On-surface variant
- Hover: Background `rgba(223, 254, 0, 0.10)`

### Inputs

- Background: Charcoal (`#161514`)
- Border radius: 1rem
- Focus state: 1px Neon Lime border + ring glow:
  ```css
  border-color: #DFFE00;
  box-shadow: 0 0 0 4px rgba(223, 254, 0, 0.10);
  ```

### Cards

- Translucent obsidian panel styling
- Headers: `label-caps` typography
- Neon Hairline border: `rgba(223, 254, 0, 0.15)`
- Backdrop blur: 24px

### Status Badges / Chips

- Compact, `rounded-full`
- High-contrast text
- Variants:
  - **Active:** Neon Lime background, dark text
  - **Success:** Laser Green background, dark text
  - **Inactive:** Steel outline, muted text
  - **Error:** Error color background

### Lists

- Thin Neon Hairline dividers
- `label-mono` for secondary data points
- CLI-inspired aesthetic

---

## Animation & Transitions

### Micro-interactions

- **Buttons:** translateY(-2px) on hover, 150ms ease-out
- **Cards:** Scale 1.02 on hover, 200ms ease
- **Focus rings:** 200ms fade in
- **Status changes:** Color transition 300ms ease

### Loading States

- Skeleton: Pulsing `surface-container` with Neon Lime shimmer overlay
- Spinner: Rotating Neon Lime ring on dark background

---

## Responsive Breakpoints

| Breakpoint | Width | Notes |
|------------|-------|-------|
| Mobile | < 640px | Single column, 20px margins |
| Tablet | 640–1024px | 2-column grids |
| Desktop | > 1024px | Full 12-column, 40px margins |

---

## Tailwind Config Reference

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#121414',
          dim: '#121414',
          bright: '#383939',
          container: {
            lowest: '#0c0f0e',
            low: '#1a1c1c',
            DEFAULT: '#1e2020',
            high: '#282a2a',
            highest: '#333535',
          },
        },
        background: '#0B0A09',
        primary: {
          DEFAULT: '#DFFE00',
          container: '#d3f000',
        },
        secondary: {
          DEFAULT: '#39FF14',
          container: '#2ff801',
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
      },
      fontFamily: {
        display: ['"Be Vietnam Pro"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backdropBlur: {
        'panel': '24px',
      },
    },
  },
};
```

---

## Assets

### Required Fonts

Load via Google Fonts or self-host:
```html
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@700;800;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

### Icons

- Use lucide-react or heroicons
- Stroke width: 1.5px
- Size: 20px (default), 16px (compact), 24px (large)
- Color: inherit from parent text color

---

## Screen References

### Dashboard
- Full dark background
- Sidebar with neon accent indicators
- Stats cards with translucent panels
- Video list with status badges
- Grid-based clip preview cards

### Landing Page
- Hero section with large headline
- Neon lime accent elements
- Dark sections with gradient overlays
- Feature cards with glassmorphism
- CTA buttons with primary neon styling

### Video Detail
- Split layout: info left, clips right
- Clip cards with preview thumbnails
- Upload status with color-coded badges
- Metadata editor with dark inputs

---

*Generated from Stitch Design System: AI Video Clipper Design System*
*Theme: Cyber-Editorial Obsidian*
*Style: Modern Cyber-Editorial with Neon Accents*