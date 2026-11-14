# Lotus pond portfolio

Live site: https://lotus-portfolio-omega.vercel.app
Backstage (editor): https://lotus-portfolio-omega.vercel.app/admin

## Editing online (recommended)
1. Open `/admin` on the live site and log in with your Backstage password.
2. **+ New project**, then fill in title, short line, year, categories and description. Changes save by themselves.
3. **Drop images** onto the Images box (or click it). Drag to reorder; the first image is the cover (★ makes any image the cover).
4. Use the arrows in the project list to change the order on the site.

Online, images and project details are stored in Vercel Blob, so redeploys never touch them.
Changing the password: Vercel → lotus-portfolio → Settings → Environment Variables → `ADMIN_PASSWORD`, then redeploy.

## Code changes
The project is connected to GitHub (`Honglyoeng/Graphic-Portfolio`). Every push to `main` deploys automatically.

## Running on your computer (optional)
    python3 server.py

- Portfolio: http://localhost:8765
- Backstage: http://localhost:8765/admin

Locally, uploads go into `works/` and text into `projects.json`. These do **not** sync with the live Backstage, so pick one place to edit.
