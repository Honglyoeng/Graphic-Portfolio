# Lotus pond portfolio

## Start
In Terminal, inside this folder:

    python3 server.py

- Portfolio: http://localhost:8765
- Backstage (editor): http://localhost:8765/admin

## Backstage
- **+ New project**, then fill in title, short line, year, categories and description. Changes save by themselves.
- **Drop images** onto the Images box (or click it). Drag images to reorder; the first one is the cover (★ makes any image the cover).
- Use the arrows in the project list to change the order projects appear on the site.
- Uploaded images go into `works/`; all text goes into `projects.json`.

## Publishing
Upload `index.html`, `projects.json` and the `works/` folder to any static host (Vercel, Netlify, GitHub Pages).
Backstage only works on your own computer while `server.py` is running. Edit locally, then upload again.
