# Accessibility (접근성)

> 5.5 UX Enhancement — 40–60 age users, screen reader support.

## Implemented

- **High contrast mode** — Settings → 보기 설정. CSS variables override.
- **Font size toggle** — 작게(14px) / 보통(16px) / 크게(18px). Persisted in localStorage.
- **Skip link** — "Skip to main content" link; visible on keyboard focus; targets `#main-content`.
- **Main landmark** — `<main id="main-content" role="main" aria-label="Main content">`.
- **Nav** — Bottom/top nav uses `<nav aria-label="메뉴">`.
- **Toggle / form controls** — Toggle uses `role="switch"` and `aria-label` where provided.

## Screen reader audit checklist

| Item | Status |
|------|--------|
| Skip to main content link | Done |
| Main content landmark (id + role) | Done |
| Navigation landmark + aria-label | Done |
| Buttons / CTAs with aria-label or visible text | Review per page |
| Form inputs with associated labels | Use FormInput / label; review forms |
| Tables: scope / caption where needed | DataTable; add caption if missing |
| Images: alt text when images are added | Use next/image with alt |

## Future

- Race/horse images: use `next/image` with meaningful `alt` when adding photo assets.
- Optional: prefer-reduced-motion media query for animations.
