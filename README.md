# F1 Tax Helper

AI-powered tool to help international students on F-1 visas understand US taxes.

## Tech stack

- **React 18** — UI
- **Vite** — build tool and dev server
- **Tailwind CSS** — styling

## Folder structure

```
f1-tax-helper/
├── public/           # Static files (favicon, etc.)
├── src/
│   ├── assets/       # Images, fonts, other assets
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks
│   ├── layout/       # Layout components (header, shell)
│   ├── pages/        # Page-level components
│   ├── utils/        # Helpers and utilities
│   ├── App.jsx       # Root app component
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles (Tailwind)
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Commands to run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the dev server**

   ```bash
   npm run dev
   ```

   Then open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

3. **Build for production**

   ```bash
   npm run build
   ```

4. **Preview production build locally**

   ```bash
   npm run preview
   ```
