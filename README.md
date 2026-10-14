# Invoice Builder

A print-ready invoice template that runs in the browser. It's a static site with no build step, so it deploys on Vercel as-is.

## Features
- Bordered A4 layout: a double outer frame, a boxed header band, and a fully bordered line-items table and totals table
- A larger logo in a bordered frame (**Upload logo** in the toolbar to use your own, **Default logo** to go back)
- An accent colour picker that restyles the whole invoice
- Line items, discount and tax are calculated automatically
- Everything you type is saved in your browser (localStorage)
- **Print / Save PDF** prints exactly one A4 page and hides the editor controls
- **New** starts the next invoice: it increments the invoice number and keeps your company details and logo

## Files
- `index.html`: the invoice markup
- `styles.css`: screen and print styles (`@page` A4, borders, colours)
- `app.js`: editing, totals, logo upload, saving
- `logo.svg`: the default logo; replace this file to change it for everyone

## Deploy on Vercel
Import this repository in Vercel, choose the **Other** framework preset, and leave the build command empty.
