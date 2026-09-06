# Rain — rain.ceo

The Rain studio site: a single-page, water-themed experience served from `Rain.dc.html`.

## How it deploys

- **Production**: pushes to `main` auto-deploy to [rain.ceo](https://rain.ceo) via Vercel (Git integration).
- **Previews**: every other branch push gets a Vercel preview URL.

Do not deploy from a local machine with `vercel --prod` — `main` is the single source of truth.

## Layout

| Path | What it is |
| --- | --- |
| `Rain.dc.html` | The entire site (markup + inline styles), served at `/` per `vercel.json` |
| `rain-flow.css` | Styles for the post-hero sections (storms, stormline, gale, basin, advisory) |
| `rain-flow.js` | Interactions for those sections |
| `rainfall.js` | Rainfall CMS hydration — swaps published copy into `data-rf` tagged elements |
| `support.js` | Runtime that boots the page |
| `api/contact.js` | Contact form endpoint |
| `assets/`, `work/` | Images |

## Editing copy

Elements tagged `data-rf` / `data-rf-pre` / `data-rf-post` hydrate from the Rainfall CMS.
Untagged copy is hard-coded in `Rain.dc.html`.

## Cache busting

When changing `rain-flow.css` or `rain-flow.js`, bump the `?v=` query on their tags in
`Rain.dc.html` so browsers pick up the new version.
