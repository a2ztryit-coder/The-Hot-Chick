# Offline Hotel POS (React PWA)

A fully offline-first Hotel/Fast-Food POS web app with:

- React + HTML + CSS + JavaScript
- IndexedDB local storage (no backend)
- PWA install support
- Cashier, Admin PIN panel, Reports, PDF export
- Backup/Restore JSON

## Features Included

- Cashier screen with large touch buttons
- Search menu items
- Dine-in / Parcel billing with configurable parcel charge (default Rs 20)
- Cart quantity increase/decrease/remove
- Subtotal, parcel charge, discount, grand total
- Bill generation with auto daily token (resets each day)
- Printable receipt with shop details and footer
- Admin PIN login
- Category CRUD and enable/disable
- Menu item CRUD, selling/cost price changes, enable/disable
- Shop info update (name, address, phone)
- Parcel charge update
- Receipt message update
- Admin PIN change
- Backup all data to JSON
- Restore from JSON
- Reset today token
- Reset all app data (with confirmation)
- Reports: today's sales, orders, revenue, cost, net P/L, best item, item-wise sales
- Daily closing report export as PDF
- Light/Dark mode

## Install and Run

1. Install Node.js (LTS) from the official website.
2. Open terminal in this folder.
3. Run:

```bash
npm install
npm run dev
```

4. For production build:

```bash
npm run build
npm run preview
```

## PWA Install

- Open the app in Chrome/Edge/Safari on mobile/desktop.
- Use browser "Install App" or "Add to Home Screen".

## Default Admin PIN

- `1234`

Change it in Admin panel after first login.
