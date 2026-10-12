# Kopi Sesuk ERP

## Deployment configuration

This React application is deployed on Netlify with Vite. `netlify.toml` sets the
build command and `dist` publish directory and serves the application for routes
such as `/login` and `/dashboard`, including direct visits and page refreshes.

The site's Netlify build settings must also use `npm run build` as the build
command and `dist` as the publish directory. Deploy the generated `dist` folder,
not the repository root. If the deployed HTML still references `/src/main.jsx`,
the deployment contains uncompiled source; browsers cannot execute that JSX
entry point. Updating environment variables alone cannot fix a source-only
deployment. Publish a new built deployment after correcting the site settings.

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the site's Netlify
environment settings with availability during builds, then redeploy. Vite embeds
these settings at build time; changing them requires a new deployment. Use only
the browser-safe Supabase anon/publishable key, never a service-role or secret key.
For local development, set these variables in an untracked `.env.local` file.

If either setting is missing or client initialization fails, the login page
displays a configuration notice and disables sign-in instead of crashing to a
blank page. No credentials or configuration values are shown in that notice.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
