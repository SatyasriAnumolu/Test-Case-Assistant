# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Importing Azure DevOps test cases

Choose an area path, test plan, or suite to limit the number of cases synchronized. Leaving
the area path empty with the "All Test Cases" scope imports the whole project and can take
considerably longer for large projects.

The imported test cases table displays 50 cases at a time. Use Previous, Next, or the page
number to navigate; all imported cases remain available to the application's analysis pages.
Connection details and imported cases are held in the browser session and are cleared on reload.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
