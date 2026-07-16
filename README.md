# VIBEverse

Portal interno de engagement para la organizacion SEPO. Centraliza noticias,
calendario de eventos, trivias, la revista "AI is your ally", Monthly Digest,
Manager Hub y el programa Rewards & Recognition.

> Prototipo de frontend (React + Vite). Los datos viven en `localStorage` como
> mock; en produccion se conectan a un backend AWS (ver `BACKEND.md`).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # genera dist/
npm run preview  # sirve el build
```

## Demo de roles

Arriba a la derecha hay un selector de usuario que simula el login (Midway en
produccion). Cambia entre Colaborador, Manager, Manager SEPO y VIBE Admin para
ver como cambia el portal segun el rol.

## Stack

React 18, Vite, React Router (HashRouter), Motion, Lucide, react-pageflip,
react-pdf. Sin backend todavia: ver `BACKEND.md` para el plan de AWS/DynamoDB/Midway.

## Deploy

Push a `main` dispara el workflow de GitHub Pages (`.github/workflows/deploy.yml`),
que compila y publica `dist/` automaticamente.
