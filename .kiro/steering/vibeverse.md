# VIBEverse - Steering / Contexto completo del proyecto

> Documento de contexto para cualquier sesion futura de Claude/Kiro que trabaje
> en VIBEverse. Cubre el que, el por que, la arquitectura, cada archivo, las
> convenciones NO NEGOCIABLES y el estado actual. Leelo entero antes de tocar
> codigo. Esta escrito para que una IA pueda retomar el proyecto sin contexto
> previo.

---

## 0. Reglas de oro (LEER PRIMERO, son estrictas)

Estas reglas vienen del usuario y NO se negocian. Romper cualquiera de ellas es
un error grave que hay que corregir de inmediato.

1. **CERO emojis** en cualquier parte (codigo, comentarios, UI, datos, commits).
   En su lugar se usan iconos de `lucide-react` via el componente `Icon`.
2. **CERO em-dashes / en-dashes / caracteres tipograficos raros.** Prohibidos:
   `—` (em dash), `–` (en dash), `·` (middle dot), `‹` `›` (angle quotes).
   Usar coma, parentesis o dos puntos. Esto aplica a TODO: codigo, comentarios,
   textos de UI, datos seed.
   - Comando de verificacion (correr SIEMPRE despues de editar):
     ```bash
     grep -rnP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}]|—|–|·|‹|›' src/
     ```
     Debe salir vacio ("CHAR SCAN CLEAN"). Nota: hay dos `Cerró` con acento en
     `src/lib/format.js` (countdown) que son texto en espanol legitimo, el acento
     no esta prohibido; lo prohibido son los guiones/simbolos de arriba.
3. **Textos de UI en espanol** (sin tildes obligatorias por el equipo, pero las
   tildes normales del espanol estan permitidas; lo que importa es cero emojis y
   cero em-dashes). El tono es cercano y claro, para toda la poblacion de SEPO.
4. **Siempre compilar despues de cambios** para verificar:
   ```bash
   npm run build   # debe terminar en "built in ..." sin errores
   ```
5. **Radios de borde "leves"**: `--radius: 6px`, `--radius-sm: 4px`,
   `--radius-lg: 8px`. NADA de pills / `border-radius: 999px`. Rectangulos suaves.
6. **Todos los loaders son skeleton loading** (shimmer), NO spinners. Ver seccion
   de estilos. Ya se eliminaron los spinners; mantener esa decision.
7. **Flujo de trabajo preferido del usuario**: cuando pide "haz los cambios sin
   decirme nada", hace los cambios, revisa que el codigo no tenga nada ilogico o
   mejorable, y al final SOLO da el link local. El usuario a veces usa el IDE Kiro
   que NO muestra bien los mensajes de texto del asistente (llegan vacios o como
   "."), asi que conviene ser conciso y accionar en vez de preguntar de mas.

---

## 1. Que es VIBEverse

Portal web interno de **engagement** para la organizacion **SEPO** de Amazon
(~1800 personas). Reemplaza una extension de navegador antigua que era solo para
managers; ahora es para **toda la poblacion** de SEPO.

- **VIBE** = Visibility, Information, Bridge and Engagement. Es el equipo dentro
  de SEPO que opera el portal (hace flyers, trivias, concursos, eventos, maneja
  Rewards & Recognition, etc.).
- **Slogan**: "donde todo pasa" (aparece bajo el logo en el topbar).
- **Estado**: prototipo de **frontend** funcional. Los datos viven en
  `localStorage` como mock. En produccion se conecta a un backend AWS (DynamoDB +
  Midway). Ver `BACKEND.md` en la raiz para el plan completo de AWS.

### Funcionalidades (tabs / secciones)
- **Inicio (Home)**: carrusel de flyers, noticia destacada, eventos en vivo,
  deadlines que cierran pronto, trivias activas, accesos rapidos, mas noticias,
  y el bloque promo de "AI is your ally".
- **Calendario**: calendario mensual de eventos/actividades + lista de proximos +
  boton para sugerir una actividad faltante.
- **Trivias**: tarjetas que enlazan a Microsoft Forms (no hay scoring in-app).
- **AI is your ally**: revista mensual estilo page-flip (PDF o imagenes) + el
  flyer standalone de la idea del mes. Ver seccion dedicada mas abajo.
- **Monthly Digest**: resumen del mes (noticias, eventos, trivias, links). Es
  DISTINTO de "AI is your ally".
- **Manager Hub** (solo manager+): recursos para managers (solicitar arte, PPT,
  enviar ideas por Slack) y, DENTRO de el, la seccion de **Rewards & Recognition**
  (solo visible para sepo_manager y admin).
- **Cumpleanos** (solo manager+): cumpleanos y amaversarios del mes.
- **Admin** (solo admin): back-office para editar TODO el contenido.

---

## 2. Stack tecnico

- **React 18** + **Vite 5**, SPA.
- **react-router-dom v6** con **HashRouter** (routing 100% client-side, ideal para
  S3/CloudFront o GitHub Pages sin rewrites de servidor).
- **motion** (framer-motion v12, import desde `'motion/react'`): transiciones de
  pagina y el carrusel coverflow.
- **@formkit/auto-animate**: animaciones de listas (agregar/quitar items).
- **lenis**: smooth scroll ("buttery").
- **lucide-react**: iconos outline/hollow (el look "hueco" estilo VIBE-Quiniela).
- **react-pageflip** + **page-flip**: efecto de revista que pasa paginas.
- **react-pdf** + **pdfjs-dist**: render de PDF para las ediciones tipo PDF.
- Sin backend todavia. Sin TypeScript (todo JS/JSX). Sin libreria de estado
  (Context API propio). Sin CSS framework (un solo `styles.css`).

### Comandos
```bash
npm install
npm run dev      # Vite dev server en http://localhost:3000 (host 0.0.0.0)
npm run build    # genera dist/
npm run preview  # sirve el build en :3000
```

### DevSpace / preview local
El dev server corre en el puerto **3000**. En DevSpaces se accede por el proxy:
`https://ds-qb2c7z3z--3000.us-east-1.prod.proxy.devspaces.amazon.dev`
(boton "Connect" del puerto 3000; recargar con Ctrl/Cmd+Shift+R para bustear cache).
Nota: el `DEVSPACE_ID` (`ds-qb2c7z3z`) puede cambiar entre entornos; si cambia,
la URL del proxy cambia igual. `vite.config.js` tiene `allowedHosts: true` y
`hmr.clientPort: 443` para que el proxy funcione.

### Deploy
- Repo GitHub: `https://github.com/varseana/vibeverse.git`, branch `main`.
- `.github/workflows/deploy.yml` compila y publica a **GitHub Pages** en cada push
  a `main` (Node 24, `npm ci`, `npm run build`, sube `dist/`).
- `vite.config.js` usa `base: './'` (rutas relativas) para que funcione en
  cualquier subpath de Pages.
- **IMPORTANTE**: GitHub Pages debe estar habilitado manualmente una vez en
  Settings > Pages > Source: "GitHub Actions". Si sale el error "Get Pages site
  failed", es que aun no se habilito. El usuario hace los push manualmente.

---

## 3. Estructura de archivos (mapa completo)

```
VIBEverse/
├── index.html                 # HTML root, carga fuentes Inter + Rubik de Google
├── vite.config.js             # base './', server puerto 3000, allowedHosts
├── package.json               # deps, scripts
├── README.md                  # readme corto en espanol
├── BACKEND.md                 # PLAN AWS/Midway/DynamoDB completo (leer si se toca backend)
├── .github/workflows/deploy.yml  # GitHub Pages CI
├── .kiro/steering/vibeverse.md   # ESTE documento
├── public/vibe-logo.png       # logo (tambien en src/assets)
└── src/
    ├── main.jsx               # entry: HashRouter > AuthProvider > StoreProvider > App
    ├── App.jsx                # topbar, nav, rutas, guards, role switcher, smooth scroll
    ├── styles.css             # TODO el CSS (un archivo, ~700 lineas), tema cosmico
    ├── assets/vibe-logo.png
    ├── data/
    │   └── seed.js            # TODA la data mock + helpers SVG. La fuente de verdad del schema.
    ├── lib/
    │   ├── auth.jsx           # roles, DEMO_USERS, AuthProvider, useAuth
    │   ├── store.jsx          # Content store (localStorage), useStore, add/update/remove/digest helpers
    │   ├── api.js             # cliente API (contrato congelado, hoy MODE=mock)
    │   ├── eventState.js      # deriva live/upcoming/ended y estado de deadlines
    │   ├── format.js          # fmtDate, fmtShort, countdown
    │   ├── digestExport.js    # genera HTML email + descarga .eml, themes de email
    │   ├── digestLayout.js    # modelo filas/columnas del digest + normalizacion + helpers puros
    │   └── auroraThemes.js    # 10 aurora themes para backdrop web del Monthly Digest
    ├── pages/
    │   ├── Home.jsx           # inicio (trivias con imagen de fondo)
    │   ├── Calendar.jsx       # calendario mensual + proximos + SuggestActivity
    │   ├── Trivias.jsx        # toggle live/past, imagen de fondo con fade
    │   ├── AiAlly.jsx         # revista "AI is your ally" (code-split / lazy, skeleton)
    │   ├── MonthlyDigest.jsx  # newsletter con aurora backdrop, animaciones, confeti
    │   ├── ManagerHub.jsx     # recursos de manager + Rewards adentro
    │   ├── Rewards.jsx        # RewardsSection (nominaciones + guia de premios)
    │   ├── People.jsx         # cumple anos + amaversarios
    │   └── Admin.jsx          # back-office con todos los sub-editores (~1150 lineas)
    └── components/
        ├── Icon.jsx           # mapa central de iconos lucide (usar SIEMPRE esto)
        ├── GalaxyBackground.jsx  # fondo Via Lactea procedural en canvas
        ├── FloatingLogo.jsx      # logo flotante gravedad cero + combo counter + doom fire
        ├── PageTransition.jsx    # wrapper motion para fade+slide entre rutas
        ├── FlyerCarousel.jsx     # carrusel coverflow de flyers en Home
        ├── EventBanner.jsx       # banner horizontal para "en vivo" en Home
        ├── EventCard.jsx         # tarjeta de evento. Owner NUNCA se muestra.
        ├── AiAllyPromo.jsx       # bloque promo: flyer de la idea izq, texto+botones der
        ├── Magazine.jsx          # lector page-flip (soporta kind 'pdf' e 'images')
        ├── ImageEditor.jsx       # editor tipo Instagram (crop/zoom/drag) -> JPEG data URL
        ├── ImagePositioner.jsx   # drag para elegir object-position de una URL
        ├── PhotoCropper.jsx      # overlay cuadrado 1:1, zoom + drag, output 80x80 JPEG
        ├── DigestEditor.jsx      # block editor con dnd-kit sortable (~780 lineas)
        └── SuggestActivity.jsx   # CTA + form para sugerir actividad faltante
```

---

## 4. Sistema de roles y autenticacion (`src/lib/auth.jsx`)

Cuatro roles con rango jerarquico:

| role | label | rank |
|---|---|---|
| `collaborator` | Colaborador | 0 |
| `manager` | Manager | 1 |
| `sepo_manager` | Manager SEPO | 2 |
| `admin` | VIBE Team (Admin) | 3 |

- **Default = `collaborator`** para cualquiera que no este en el allowlist (modelo
  "todos en SEPO entran").
- El allowlist (`ROLE_ALLOWLIST` en `seed.js`) mapea login -> role. Es la mini
  version de la tabla `vibe-roles` de DynamoDB.
- `useAuth()` expone: `login`, `setLogin`, `role`, `roleLabel`, `rank`,
  `can(minRole)`, `isAdmin`, `isSepoManager` (sepo_manager O admin),
  `isManager` (rank >= manager).
- **Demo role switcher**: dropdown arriba a la derecha (`RoleSwitcher` en App.jsx)
  que cambia el `login` activo entre 4 `DEMO_USERS`. Persiste en localStorage
  (`vibe_demo_login`). En produccion esto se reemplaza por Midway SSO + `GET /me`.
- Los `Guard` en App.jsx protegen rutas por rango minimo. IMPORTANTE: ocultar tabs
  y guardar rutas es solo UX; la seguridad real la hace el backend (ver BACKEND.md).

---

## 5. Content store (`src/lib/store.jsx`)

- Context provider que guarda TODO el contenido editable en un objeto y lo
  persiste en `localStorage` bajo la KEY **`vibeverse_content_v8`**.
  - **Si cambias la forma de la data seed de manera incompatible, sube la version
    de la KEY** (v8 -> v9) para invalidar el localStorage viejo de la gente, o
    quedaran con data vieja. El merge es `{ ...DEFAULTS, ...JSON.parse(raw) }`, asi
    que campos nuevos a nivel top-level se toman de DEFAULTS, pero cambios dentro
    de arrays existentes NO se migran.
- Secciones (colecciones): `flyers`, `news`, `links`, `events`, `awards`,
  `aiEditions`, `trivias`, `birthdays`, `amaversaries`, `suggestions`.
- Ademas guarda `homeSections`: objeto `{ key: bool }` con la visibilidad de cada
  bloque del Home (ver seccion 7.5). `load()` hace deep-merge de esta key para que
  secciones nuevas defaulten a `true`. Setter: `toggleHomeSection(key)`. El export
  `HOME_SECTIONS` (en store.jsx) es la lista `{ key, label }` de bloques togglables.
- Helpers genericos:
  - `add(section, item)` -> agrega con `id = section + '_' + Date.now()`.
  - `update(section, id, patch)` -> merge parcial.
  - `remove(section, id)` -> filtra por id. (Por eso TODO item necesita `id`.)
- Helpers especificos:
  - `setHomeFlyer(id)` -> marca un solo flyer como `isHome`.
  - `addAward(award)` -> crea award con id slug estable (`awd_<slug>_<base36>`),
    `active: true`, `order` al final de su cadencia.
  - `toggleAwardActive(id)` -> soft-delete (flip `active`), NO borra, para no
    romper nominaciones historicas.
  - `setCurrentEdition(id)` -> marca una sola edicion de AI Ally como `current`.
  - `reset()` -> vuelve a DEFAULTS (boton "Restaurar por defecto" en Admin).
- `useStore()` devuelve `{ ...content, add, update, remove, setHomeFlyer,
  addAward, toggleAwardActive, setCurrentEdition, reset }`.

### Convenciones de datos importantes
- **NO usar `Date.now()` para timestamps de negocio** dentro de items que deban
  ser deterministas; se deja para el backend. El `id` si usa `Date.now()`.
- **Nunca mutar arrays del store en su lugar** (ej. `.sort()`). Copiar primero:
  `[...arr].sort(...)`. Ya hubo un bug por esto en People.jsx.
- Todo item de una coleccion DEBE tener `id` (remove filtra por id). Los seed
  tienen ids explicitos (`fl_1`, `news_1`, `bd_1`, `am_1`, `awd_...`, etc.).

---

## 6. Data seed (`src/data/seed.js`) - el schema de facto

Este archivo define la forma de cada entidad. Cuando llegue el backend, DynamoDB
debe devolver estas mismas formas. Resumen de cada export:

- **Helpers SVG** (generan placeholders data-URL, sin red):
  - `svgFlyer(title, c1, c2)` -> flyer horizontal 960x420 (carrusel).
  - `svgIdeaFlyer(idea, author, c1, c2)` -> flyer vertical 900x1100 de la IDEA del
    mes (standalone, para el promo de AI Ally). Es SEPARADO de la revista.
  - `svgPage(title, subtitle, c1, c2)` -> pagina vertical 800x1131 de la revista.
- **VIBE_TEAM**: comite VIBE (name + login). No editable en Admin, referencia.
- **FLYERS**: `{ id, title, image, link, isHome }`. Carrusel de Home. Un solo
  `isHome: true` (imagen destacada, se centra).
- **AI_EDITIONS**: ediciones mensuales de "AI is your ally". Ver seccion 7.
- **NEWS**: `{ id, title, body, date, tag, pinned }`. Un solo `pinned` como hero.
- **QUICK_LINKS**: `{ id, label, url, icon, category, managerOnly? }`. `icon` es
  nombre de icono lucide (ver Icon.jsx). URL que empieza con `#` es interna
  (react-router). `managerOnly` la oculta a colaboradores.
- **LINK_ICON_OPTIONS**: iconos ofrecidos en el editor de links.
- **TRIVIAS**: `{ id, title, description, url, opensAt, closesAt }`. `url` es un
  Microsoft Form. No hay scoring interno.
- **EVENT_TYPES**: `['Evento','Trivia','En vivo','Flyer','Concurso','Deadline']`.
- **EVENTS**: `{ id, title, date, endDate?, deadline?, deadlineLabel?, type,
  owner, image?, imageMode?, imageOpacity? }`.
  - `date` es inicio (YYYY-MM-DD, requerido). `endDate` opcional (multi-dia).
  - `deadline` opcional (cierre de inscripcion/envio) + `deadlineLabel` que
    explica que significa.
  - **`owner`** = miembro VIBE responsable. Es info INTERNA: NUNCA se muestra en
    vistas publicas (Home/Calendar/Digest). Solo aparece en Admin.
  - live/upcoming/ended se DERIVA de fechas (eventState.js), no se guarda.
  - `title` limitado a **50 caracteres** en el editor.
  - imagen opcional con `imageMode` ('blur'|'solid') y `imageOpacity` (0.1-1).
- **BIRTHDAYS**: `{ id, login, manager, day, month }`. Solo dia+mes (NUNCA ano,
  por clasificacion de datos: DoB completo = Highly Confidential).
- **AMAVERSARIES**: `{ id, login, manager, day, month, years }`.
- **AWARDS**: catalogo MODULAR de premios. Ver seccion 8. Cada award tiene
  `amount` (monto de gift card en USD) que SOLO ve/edita el equipo R&R.
- **CADENCES**: `['Weekly','Monthly','Quarterly','Annual']` (orden importa en UI).
- **CURRENT_PERIOD**: periodo "actual" por cadencia (reloj demo 2026-07-15).
  Cualquier nominacion a otro periodo es RETROACTIVA.
- **periodOptions(cadence)**: periodos seleccionables (actual + varios pasados).
- **RR_MANAGERS**: array de logins del equipo R&R (los unicos que ven/gestionan
  R&R: todas las nominaciones, entrega, montos). Es un circulo MAS PEQUENO que los
  admins de VIBE. Editar esta lista para reflejar a los duenos reales de R&R.
- **PROGRAM_INFO**: texto de como VIBE corre R&R (export sin uso actualmente en la
  UI; se puede limpiar).
- **REWARDS**: nominaciones demo. `{ id, awardId, awardName, cadence, period,
  retroactive, nominee, nominatedBy, deliveryStatus, deliveredBy? }`.
  `awardId` es el id ESTABLE del award (renombrar el award no rompe historial).
  `deliveryStatus`: 'pending' | 'delivered'. Es ENTREGA, no aprobacion.
  **NO hay `reason`**: el texto/justificacion NO es data que se guarde; el manager
  solo elige a quien + que premio + periodo.
- **REWARD_DEADLINES**: `{ cadence, period, dueAt (ISO UTC), custom }`. Hora Costa
  Rica UTC-6, cierre 17:00 (23:00Z). Son OBJETIVO, no bloquean (retroactivo OK).
- **ROLE_ALLOWLIST**: login -> role. La tabla `vibe-roles` en miniatura.

---

## 7. "AI is your ally" (concepto clave, tiene DOS cosas separadas)

Iniciativa mensual de SEPO: recopilar ideas reales de companeros sobre como usar
IA en el trabajo, y publicarlas. Cada edicion mensual (`AI_EDITIONS`) agrupa **dos
cosas distintas que NO hay que confundir**:

1. **El FLYER de la idea** (`edition.flyer`): UNA imagen standalone que presenta la
   idea de un companero del mes. Se muestra en el bloque promo (Home y preview de
   Admin), a la IZQUIERDA. Es una sola imagen, NO se hojea.
2. **La REVISTA** (`edition.pages` o `edition.pdf`): el material multi-pagina que
   se lee estilo revista (page-flip). Vive en su propia tab `/ai-ally`.
   - `kind: 'images'` -> `pages` es lista de URLs 800x1131.
   - `kind: 'pdf'` -> `pdf` es data URL / URL; se renderiza con react-pdf on demand.

Metadata por edicion: `{ id (YYYY-MM), label, kind, current, description,
ideaAuthor, airoUrl, flyer, pages|pdf }`.
- `description`: de que trata la idea del mes.
- `ideaAuthor`: login del autor (se muestra en el boton "Ver mas sobre la idea de
  X en AIRO").
- `airoUrl`: link a la idea en la AIRO store.
- `current`: marca la edicion mostrada primero. Solo una a la vez
  (`setCurrentEdition`).

### Componente `AiAllyPromo.jsx`
- Layout 50/50: flyer de la idea (`edition.flyer`) a la izquierda ocupando la
  mitad, texto editable + botones a la derecha ocupando la otra mitad.
- Botones: "Ver mas sobre la idea de [autor] en AIRO" (link externo, si hay
  `airoUrl`) y, si `showMagazineButton` (default true), "Ver la revista" (Link a
  `/ai-ally`).
- Skeleton loading mientras carga la imagen del flyer; se resetea al cambiar de
  edicion (rastrea `loadedSrc === flyer`).
- En Home: `<AiAllyPromo edition={currentEdition} />` (con boton de revista).
- En AiAlly.jsx: ya NO se usa el promo (se quito el duplicado); solo la revista.
- En Admin (AiAllyAdmin): preview del promo arriba + campos editables por edicion.
- **Se ELIMINO el modal "steering" / "Que es AI is your ally?"** que existia antes.
  No re-agregar salvo peticion explicita.

### Componente `Magazine.jsx`
- `FLIP_W = 550` (pagina grande; ratio 800x1131). HTMLFlipBook con `maxWidth 680`.
- Carga cover-first: solo la portada renderiza hasta que el usuario da "Abrir
  revista" (`opened`), luego montan todas las paginas.
- Soporta `kind` 'images' e 'pdf'. Modo reduced-motion -> lectura vertical simple.
- `Leaf` usa `forwardRef` (requisito de react-pageflip).
- Loaders: SKELETON (`.skeleton skeleton-fill`), ya no spinner.

### En AiAlly.jsx
- La revista es **GRANDE en desktop y DESHABILITADA en movil** (el flip necesita
  pantalla ancha). Clases: `.mag-desktop-only` (visible) y `.mag-mobile-note`
  (nota que aparece en movil, max-width 760px). La ruta es code-split (lazy) para
  que pdf.js no pese en el bundle principal.

---

## 7.5. Toggles de secciones del Home (Admin > Inicio)

- El primer tab del Admin es **"Inicio"** (`HomeSectionsAdmin`): switches para
  prender/apagar cada bloque del Home sin borrar contenido. Util cuando un mes no
  hay trivias o noticias.
- Estado en el store: `homeSections` (`{ key: bool }`). Bloques togglables
  (`HOME_SECTIONS`): `flyers`, `news`, `live`, `deadlines`, `trivias`, `links`,
  `aiAlly`. Todos ON por default.
- En `Home.jsx` cada bloque se envuelve con `show('key')` (helper que devuelve
  true salvo que este explicitamente en false). Muchos bloques ademas se ocultan
  solos si no hay contenido (ej. `show('trivias') && trivias.length > 0`).
- Los switches usan clase `.switch` / `.switch.on` / `.switch-knob` con radios
  leves (no circular, para respetar la convencion sin-pills).
- Si agregas un bloque nuevo al Home, agregalo a `HOME_SECTIONS` en store.jsx y
  envuelvelo con `show('tuKey')` en Home.jsx.

## 8. Rewards & Recognition (contexto de negocio + tecnico)

**Contexto de negocio (dado por el usuario, respetarlo):**
- Amazon es dueno de SEPO. **VIBE** es el equipo que OPERA el programa R&R.
- **Managers tienen autonomia total**: revisan las metricas de su gente, deciden
  el premio y envian la nominacion. **El submission del manager es la decision
  final, NO requiere aprobacion de nadie.**
- **VIBE solo RECIBE la nominacion y ENTREGA el premio** (gift card u otro). Su
  unica funcion es logistica de entrega, no aprueba.
- Se permiten **nominaciones retroactivas** (premios de periodos anteriores).
- Los deadlines de R&R son OBJETIVO, no bloquean.
- **NO se guarda "razon"/justificacion** de la nominacion. El manager solo elige
  a quien + que premio + periodo. Ese texto no es data util, se quito por completo
  (modal, tarjetas, payload, seed). No re-agregar salvo peticion explicita.

**Quien puede ver/gestionar R&R (IMPORTANTE, cambio reciente):**
- Hay DOS niveles de acceso, controlados por `useAuth`:
  1. **Managers que nominan** (`sepo_manager`): ven y crean SOLO sus propias
     nominaciones. NO ven las de otros, NI montos, NI el boton de entrega.
  2. **Equipo R&R** (`isRewardsManager`, o sea logins en `RR_MANAGERS`): ven TODAS
     las nominaciones, marcan entrega, y ven/editan los MONTOS. Es un circulo mas
     pequeno (3 personas) que el equipo admin de VIBE completo.
- `isRewardsManager = RR_MANAGERS.includes(login)` (en auth.jsx). Es INDEPENDIENTE
  del rol admin: un admin de VIBE que no este en `RR_MANAGERS` NO ve montos ni las
  nominaciones ajenas.
- **Gate de visibilidad de la seccion** (ManagerHub.jsx):
  `canSeeRewards = isRewardsManager || role === 'sepo_manager'`. Un admin de VIBE
  que no sea ni R&R ni sepo_manager NO ve la seccion R&R del Manager Hub.
- OJO historico: antes el gate usaba `isAdmin`/`isSepoManager`. Ahora TODO lo de
  "ver todo / entregar / montos" usa `isRewardsManager`, NO `isAdmin`.

**Ubicacion en la UI:**
- R&R vive DENTRO de **Manager Hub** como una seccion. NO es una ruta propia.
  `Rewards.jsx` exporta `RewardsSection` que `ManagerHub.jsx` renderiza si
  `canSeeRewards`.
- Tiene dos sub-tabs (via query param `?rr=guide`): "Nominaciones y entrega" (para
  R&R) o "Mis nominaciones" (para managers), y "Guia de premios".

**Montos (`amount`, solo equipo R&R):**
- Cada award tiene `amount` (USD). Se muestra en: tarjetas de nominacion, el hint
  del premio en el modal de nominar, la guia de premios, y la lista/editor de
  Admin > Premios. SIEMPRE gateado por `isRewardsManager` (o el prop `showAmounts`
  que se le pasa). Estilo: clase `.reward-amount` (y `.reward-amount.sm`).
- En Admin > Premios el input de monto y el chip solo aparecen si `isRewardsManager`.
  `save()` normaliza `amount` a numero (o lo borra si queda vacio/invalido).

**Catalogo modular de premios (`AWARDS`):**
- Cada award: `{ id (estable), name, cadence, icon, active, order, description,
  why, eligibility, example, amount }`.
- `id` es una llave maquina estable; las nominaciones guardan `awardId`, asi que
  renombrar un premio nunca rompe el historial.
- `active` es soft-delete: archivar quita de dropdowns pero resuelve historial.
- Se edita todo desde Admin > Premios. Sera la tabla `vibe-awards` en DynamoDB.
- Guia de premios (AwardGuide): una tarjeta por premio, agrupada por cadencia,
  con que es / por que / quien / ejemplo (+ monto si eres R&R). Hay botones
  cruzados entre Admin y la guia (`/rewards?tab=guide` etc.).

---

## 9. Calendario y estado de eventos (`src/lib/eventState.js`)

- **Reloj demo fijo**: `NOW = new Date('2026-07-15T12:00:00')`. En produccion pasa
  a `new Date()`. La data seed esta cuadrada a esta fecha (julio 2026).
- `eventState(ev)` -> 'live' | 'upcoming' | 'ended', derivado de date/endDate
  (incluye todo el dia de fin).
- `deadlineState(ev)` -> null | `{ state: 'open'|'soon'|'closed', days, text }`.
  'soon' = <= 3 dias.
- `byDate` -> sort helper (soonest primero).
- Fechas se parsean como `YYYY-MM-DDT12:00:00` (mediodia local) para evitar
  off-by-one de timezone.
- `Calendar.jsx`: grid mensual construido a mano, coloca cada dia que el evento
  abarca + un marcador de deadline. `EventCard` muestra imagen de fondo opcional
  con scrim. Nunca muestra owner.

---

## 10. Estilo visual y tema (`src/styles.css`, ~532 lineas, un solo archivo)

**Paleta galaxia (variables CSS, definidas por el usuario, no cambiar sin pedir):**
```css
--vibe: #9F86D7        /* accent primario, morado suave */
--vibe-2: #D1A0E2      /* accent secundario, lavanda rosa */
--vibe-deep: #6F367D   /* magenta-morado profundo */
--vibe-mid: #594094    /* indigo medio */
--vibe-glow: rgba(159,134,215,0.45)
--bg: #140d24          /* base casi negra indigo */
--bg-2: #281b47        /* panel / fondo profundo */
--panel: rgba(209,160,226,0.06)
--panel-brd: rgba(159,134,215,0.18)
--text: #efe9f7
--muted: #b4a6d4
--good: #6fe0a8  --warn: #f0c674  --bad: #e2718f
--radius: 6px  --radius-sm: 4px  --radius-lg: 8px   /* leve, sin pills */
```
- Fuentes: **Rubik** (display: h1/h2/h3, brand) e **Inter** (cuerpo). Se cargan de
  Google Fonts en `index.html`.
- Fondo: `GalaxyBackground.jsx` pinta una Via Lactea procedural en canvas (fBm
  noise, estrellas power-law, glow aditivo, dust lanes, grano, vignette; todo
  horneado una vez a un canvas offscreen y animando solo unas decenas de
  "twinklers"). Respeta `prefers-reduced-motion`. NO depende de imagenes externas
  (el DNS esta bloqueado en este entorno; por eso es procedural, no una foto).
- **Skeleton loading unificado**: clases `.skeleton` (base shimmer),
  `.skeleton-fill` (position absolute inset 0), `.skeleton-text`, y el alias
  legacy `.mag-skel`. Animacion `@keyframes magShimmer`. Los spinners
  (`.mag-loader`, `magSpin`) fueron ELIMINADOS. Todo loader nuevo debe ser
  skeleton, no spinner.
- Clases utilitarias frecuentes: `.card`, `.card.hover`, `.grid.cols-2/3/4`,
  `.btn`, `.btn.ghost`, `.btn.sm`, `.tag`, `.tag.live`, `.pill`, `.badge-good`,
  `.badge-warn`, `.notice`, `.empty`, `.section-title`, `.page-head`, `.muted`,
  `.home-badge`, `.deadline-chip` (con `.open/.soon/.closed`), `.role-badge`
  (con clase por rol), `.overlay` + `.modal` + `.modal-actions`, `.char-count`.

---

## 11. Iconos (`src/components/Icon.jsx`)

- SIEMPRE usar `<Icon name="..." size={..} />`, nunca importar de lucide directo.
- Da el look outline fino (`strokeWidth={1.75}`, fill none). Soporta `glow`.
- Nombres disponibles (mapa `ICONS`): home, calendar, brain, target, cake, award,
  settings, news, live, sparkles, idea, slack, wiki, link, contest, trophy, clock,
  art, ppt, prev, next, plus, trash, star, external, users, ticket, image.
- Si falta un icono, se cae a `Sparkles`. Para agregar uno nuevo: importar de
  lucide-react arriba y agregarlo al mapa.

---

## 12. Capa API y plan de backend

- `src/lib/api.js`: seam unico UI <-> datos. Hoy `MODE = 'mock'` (usa el store /
  localStorage). Cuando exista backend, setear `VITE_API_BASE` y `MODE` pasa a
  'http'; adjunta el `id_token` de Midway como Bearer. **El contrato de endpoints
  ya esta congelado ahi** (`/me`, `/content/:section`, `/rewards`, etc.).
- **`BACKEND.md`** (raiz) tiene el plan AWS COMPLETO y es la referencia si se toca
  backend. Resumen: SPA en S3+CloudFront con **CloudFrontSigner** (Midway en el
  edge); API en **API Gateway + Lambda** con **ALI (Amazon Lambda Interceptor)**
  como Lambda Authorizer de Midway; datos en **DynamoDB** (KMS); imagenes en S3;
  dominio via **SuperNova**; cuenta via **Merlon/Isengard**. Clasificacion de
  datos: Confidential (cumpleanos solo dia+mes para evitar Highly Confidential).
  Cumplimiento: DACE + ASR + Kale antes de lanzar.
- El backend NO se ha construido. El usuario pauso eso para seguir iterando el
  frontend. Cuando se retome: crear cuenta AWS, tablas, handlers, y refactorizar
  `store.jsx` para que `add/update/remove` llamen a `api.*`.

---

## 13. Estado actual y trabajo reciente

- Frontend completo y funcional con data mock. Build pasa limpio.
- Deploy configurado a GitHub Pages (repo `varseana/vibeverse`), el usuario hace
  push manual; Pages debe habilitarse en Settings una vez.
- Store key: `vibeverse_content_v10`
- Boton "Restaurar por defecto" ELIMINADO del admin (peligroso).

### Cambios de sesion 2026-07-16 / 2026-07-17

#### Floating Logo (easter egg interactivo)
- `src/components/FloatingLogo.jsx` (553 lineas): logo de VIBE flotando en
  gravedad cero en el fondo de toda la app.
- Fisica: drift orbital, wobble sinusoidal, angular momentum, friccion casi nula.
- Interaccion: click empuja, drag lanza con inercia. `pointer-events: auto` en el logo.
- **Combo counter** (minijuego): rebotes contra paredes a velocidad alta (>2px/frame,
  solo user-caused) activan un odometro digital de 5 digitos (DOM dinamico, no JSX).
  Ventana de 3s entre rebotes. High score de sesion. Font: Share Tech Mono.
- **Doom Fire 8-bit**: al pasar 50 de combo se activa fuego estilo DOOM (1993) detras
  del cuadro del counter. Canvas pixelado (`image-rendering: pixelated`). Paleta de
  36 colores (negro -> morado -> magenta -> naranja -> amarillo -> blanco).
  4 tiers: EMBER (50+, 40px), BLAZE (100+, 55px), INFERNO (200+, 70px),
  SUPERNOVA (500+, 90px). Al resetear, la fuente se apaga y el fuego muere
  naturalmente frame a frame.
- Dependencia: `animejs@4.5.0` (solo `animate` se usa, para flash/glow en clicks).
- CSS: `.floating-logo-container` (fixed, z-index 0), `.floating-logo` (140px,
  opacity 0.14, glow drop-shadow permanente, hover 0.14 + brighter).
- `.content` tiene `position:relative; z-index:1` para que TODO el contenido de la
  pagina quede encima del logo flotante.

#### Trivias (mejoras)
- **Toggle live/past**: `src/pages/Trivias.jsx` ahora filtra por fecha demo
  (NOW = 2026-07-15). Dos tabs: "Activas" y "Pasadas" con conteo.
- **Imagen de fondo con fade**: campo `image` + `imagePos` por trivia. Se muestra
  a la derecha con `mask-image: linear-gradient(to left)` para fade suave.
  `<img class="trivia-bg">` con `object-fit:cover` + `object-position` dinamico.
- **ImagePositioner** (`src/components/ImagePositioner.jsx`): componente reutilizable
  para elegir que porcion de una URL se muestra. Drag para mover, guarda "X% Y%".
- **Admin Trivias**: grid cols-2, formulario compacto arriba, cards con editor
  inline expandible, campo imagen + ImagePositioner, feedback de error al publicar.
- **Home**: trivias ahora cols-2 (mas grandes) con imagen de fondo.
- 4 trivias demo en seed (2 live, 2 past).

#### Monthly Digest (newsletter builder completo)
- **Nuevo feature** implementado en 5 fases:
  1. Infraestructura: `@dnd-kit/core` + `@dnd-kit/sortable`, schema en store,
     CRUD (addDigest, updateDigest, removeDigest, publishDigest, unpublishDigest,
     setDigestSections).
  2. Block editor: `src/components/DigestEditor.jsx` con drag-and-drop sortable.
  3. Bloque People: bulk import texto + bulk foto upload (matcheo por filename),
     PhotoCropper para ajustar fotos.
  4. Preview + Export: preview inline del email, descarga .eml para Outlook.
  5. Visibilidad por rol + historial navegable.

- **Tipos de bloque**:
  - `heading`: 5 variantes (default/large/hero/accent/subtle), 3 alineaciones
    (left/center/right), hero con 2-5 gradient stops editables, accent con color
    picker + eyedropper. Barrita decorativa sigue la alineacion.
  - `text`: 4 tamanos, 3 pesos, 3 alineaciones, 5 estilos (normal/italic/muted/
    highlight/quote). Respeta `\n` literal via `.replace(/\\n/g, '\n')` + pre-wrap.
  - `image`: width% (20-100) + maxHeight (150-500px) + ImagePositioner + caption.
  - `banner`: full-width, soporta GIFs, slider de alto, link opcional.
  - `split`: imagen + texto, imageSide (left/right), imageWidth (200-600px),
    titulo configurable (posicion: sobre texto/bajo imagen/sobre todo, variante,
    align, color). PhotoCropper integrado via click en preview.
  - `people`: birthdays/amaversaries, bulk text import, bulk foto upload por
    login (soporta prefijos hyperbadge_/badge_/photo_/phonetool_), PhotoCropper
    individual por click en miniatura, grid scrolleable.
  - `divider`: separador gradiente.

- **Efectos visuales (vista publica)**:
  - Animacion alternada izq/der (motion, bloques pares desde izquierda, impares
    desde derecha, 600ms ease-out, stagger 80ms).
  - Marcos variados en fotos: 4 colores ciclicos (morado/cyan/rosa/dorado).
  - Amaversarios: marco dorado con glow pulsante (`digestGoldPulse` 2.5s).
  - Cumple Anos: dropdown de efecto (wave/shimmer/pulse/none). Wave usa
    conic-gradient rotando 360deg. Shimmer: highlight que barre 3s ease-in-out.
    Pulse: box-shadow multicolor 3s.
  - Confeti CSS: multicolor para cumple, dorado para amaversarios. Cae desde
    arriba, se difumina a la mitad (opacity 0 + blur 2px al 100% del keyframe).
    Solo en web, no en .eml.
  - Fecha completa en espanol: "20 de Julio", "3 anos, 15 de Julio".
  - `digest-body` centrado (900px max, margin auto).

- **Aurora themes** (fondo animado del digest web):
  - `src/lib/auroraThemes.js`: 10 themes (VIBE, Halloween, Navidad, Pride, Dia
    de la Mujer, Dia de la Tierra, Fiesta, Neon/Retro, Copa del Mundo, San Valentin).
  - Cada uno: `gradient` (linear-gradient 270deg), `titleColor`.
  - Selector "Aurora (web)" en las cards del listing de digests (afuera del editor).
  - Implementacion: `.digest-aurora-wrap::before` con `background-image: inherit`,
    `background-size: 600% 600%`, `animation: digestAurora 12s ease infinite`,
    `opacity: 0.6`. Contenido en z-index 1 por encima.
  - NO afecta colores de bloques individuales (es solo el lienzo de fondo).

- **Email themes** (.eml):
  - `EMAIL_THEMES` en `digestExport.js`: 8 paletas (default, halloween, christmas,
    valentines, tropical, ocean, sunset, corporate).
  - Selector "Theme email (.eml)" dentro del editor del digest.
  - Afecta: fondo, texto, bordes, accent, marcos de personas, dorado de amaversarios.
  - El .eml respeta: alineacion de texto, tamano/peso/estilo, width dinamico de
    imagenes, marcos multicolor (cumple) y dorados (amaversarios), barrita de
    headings con posicion. `\n` se convierte a `<br/>`.
  - Descarga como `.eml` con `X-Unsent: 1` (borrador en Outlook).

- **Editor UX**:
  - Auto-save debounced (1.5s), indicador visual (guardado/guardando/sin guardar).
  - Preview por bloque (boton ojo, muestra render real).
  - Boton duplicar por bloque (deep copy con nuevo id, inserta debajo).
  - Botones de agregar bloque arriba (inserta al inicio) y abajo (al final).
  - HeroGradientEditor: 2-5 bolitas de color, add/remove, preview de barrita.
  - AccentColorPicker: 1 bolita + eyedropper (EyeDropper API).
  - `input[type=color]` sin chrome del browser (appearance:none + swatch rules).
  - PhotoCropper (`src/components/PhotoCropper.jsx`): overlay cuadrado 1:1, drag +
    zoom (1x-3x), grid de composicion, output 80x80 JPEG.

- **Archivos nuevos creados**:
  - `src/components/FloatingLogo.jsx` (553 lineas)
  - `src/components/DigestEditor.jsx` (~780 lineas)
  - `src/components/ImagePositioner.jsx` (73 lineas)
  - `src/components/PhotoCropper.jsx` (122 lineas)
  - `src/lib/digestExport.js` (~160 lineas)
  - `src/lib/auroraThemes.js` (56 lineas)

- **Dependencias nuevas**:
  - `animejs@4.5.0` (animate para FloatingLogo)
  - `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` (drag-and-drop en DigestEditor)

#### Monthly Digest: layout de filas y columnas (LEGO)
- **Cambio de arquitectura**: el digest paso de una lista plana de bloques a un
  modelo de FILAS y COLUMNAS para poder componer bloques lado a lado (dividir
  vertical, estilo LEGO). Fuente de verdad: `src/lib/digestLayout.js`.
  - Shape: `Row { id, type:'row', columns: Column[] }`,
    `Column { id, span (1-4), block }`. Un bloque por columna.
  - `MAX_SPAN = 4`, `MAX_COLS_PER_ROW = 4`.
  - **Retrocompatibilidad total**: `normalizeRows(sections)` convierte los digests
    viejos (array plano de bloques) en filas de una sola columna al LEER, con ids
    estables (`row_<blockId>` / `col_<blockId>`). Por eso NO se subio la KEY del
    store: el read path es 100% compatible; al guardar se escribe el shape nuevo.
    `normalizeRows` es idempotente (se puede correr sobre data ya normalizada).
  - Todos los helpers son PUROS (no mutan): `moveColumn`, `reorderRows`,
    `extractColumnToNewRow`, `addBlockRow`, `addBlockColumn`, `removeColumn`,
    `duplicateColumn`, `resizeColumn`, `updateColumnBlock`. `pruneEmptyRows` borra
    filas sin columnas.
- **Editor** (`DigestEditor.jsx`): reescrito con el patron MultipleContainers de
  dnd-kit (basado en el ejemplo oficial clauderic/dnd-kit).
  - `DndContext` con `collisionDetection` combinada: `pointerWithin` -> fallback
    `rectIntersection` -> `lastOverId` (para que `over` no parpadee a null).
  - `onDragOver` mueve columnas entre filas EN VIVO (reflow mientras arrastras).
  - Cada COLUMNA es `useSortable` (handle propio); cada FILA es `useDroppable` con
    `SortableContext horizontalListSortingStrategy`.
  - **Gaps** (`ColumnGap`, droppables `gap:rowId:index`): costuras finas entre
    columnas que se "arman" con glow al arrastrar; soltar ahi inserta en ese slot.
  - **Rails** (`RailDroppable`, droppables `rail:position`): franjas horizontales
    entre filas; soltar ahi extrae la columna a una fila nueva full-width.
  - **DragOverlay** via `createPortal` a `document.body`: la pieza se levanta con
    scale + tilt (`.digest-drag-overlay`). NO montar el mismo `useSortable` dentro
    del overlay (colision de id); se renderiza `BlockPreview`.
  - `BlockPicker` / `AddSlot`: popover con los 7 `BLOCK_TYPES` para el boton "+"
    (agregar columna en una fila, o fila nueva abajo).
  - `MeasuringStrategy.Always` en droppables (hit-testing correcto entre filas).
  - `BlockEditor`, `BlockPreview`, `newBlock`, y todos los sub-editores
    (`SplitBlockEditor`, `PeopleBlockEditor`, etc.) se REUSARON intactos.
- **Vista publica** (`MonthlyDigest.jsx`): normaliza y renderiza cada fila como
  flex de columnas (`.digest-pub-row` / `.digest-pub-col`, `flexGrow: span`). La
  animacion motion ahora es POR FILA (no por bloque). `DigestBlock` no cambio.
- **Export .eml** (`digestExport.js`): `renderRow` emite filas de una sola columna
  como bloque directo (full-width) y filas multi-columna como tabla anidada con un
  `<td width="%">` por columna segun span (lado a lado, fijo). Desktop-only por
  decision del usuario: NO hay apilado responsive en movil, y el sitio/correo no
  estan pensados para movil.
- CSS nuevo en `styles.css` (al final del bloque digest): `.digest-row`,
  `.digest-col`, `.digest-col-gap`, `.digest-row-rail`, `.digest-picker-*`,
  `.digest-drag-overlay`, con springs y respeto a `prefers-reduced-motion`.
- Se corrigieron de paso los caracteres prohibidos en los comentarios de
  `FloatingLogo.jsx` (tenian `⁘` y un em-dash); el char-scan ahora sale limpio.

#### Digest editor: cambiar tipo + vista previa + Admin lazy
- **Cambiar tipo de bloque** (`changeBlockType` en `DigestEditor.jsx`): cada
  columna tiene un boton (icono del tipo) que abre el `BlockPicker` con "Cambiar
  a" y resalta el tipo actual (`activeType`). Preserva el contenido plano que
  mapea entre tipos (texto<->titulo, src/caption de imagen, etc.); lo que el tipo
  destino no usa cae a los defaults de `newBlock`. Conserva el mismo `id`.
- **Vista previa** dentro del editor: boton "Vista previa" en la barra de guardado
  que renderiza las filas como la vista publica limpia (`BlockPreview`, sin
  handles/gaps/rails/DnD). Se sale con "Salir de vista previa". Clases
  `.digest-preview-surface` (reusa `.digest-pub-row/.digest-pub-col`).
- Estas dos capacidades venian de unos prototipos (`/lab` y `/studio`) que se
  usaron para elegir la interaccion (gano AeroSnap). Ya se ABSORBIERON en el
  editor real y **los prototipos se eliminaron** (paginas, rutas y CSS `.lab-*` /
  `.st-*`). No re-crear salvo peticion.
- **Admin es lazy** (`const Admin = lazy(() => import('./pages/Admin.jsx'))` en
  `App.jsx`, envuelto en `Suspense`). Admin carga el editor de bloques + dnd-kit,
  que solo los admins abren; separarlo bajo el bundle principal de ~597KB a
  ~457KB (Admin queda en su propio chunk ~145KB). El fallback es un skeleton
  simple ("Cargando editor...").

### Pendientes / futuro
- Conectar backend AWS (ver BACKEND.md), cuando el usuario lo decida.
- Habilitar GitHub Pages y verificar el deploy en vivo.
- Monthly Digest: posible export a PDF ademas de .eml.
- FloatingLogo: el combo counter podria tener un leaderboard persistente.

---

## 14. Checklist antes de dar por terminado un cambio

1. [ ] `grep -rnP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}]|—|–|·|‹|›' src/` sale limpio.
2. [ ] Cero emojis nuevos.
3. [ ] `npm run build` termina sin errores.
4. [ ] Radios leves, sin pills. Loaders = skeleton, no spinner.
5. [ ] No se mostro `owner` de eventos en vistas publicas.
6. [ ] No se mutaron arrays del store en su lugar.
7. [ ] Si cambio el shape de la data seed de forma incompatible, se subio la KEY
       de version en store.jsx.
8. [ ] Textos de UI en espanol, tono cercano.
9. [ ] Al final, dar SOLO el link local si el usuario lo pidio asi:
       `https://ds-qb2c7z3z--3000.us-east-1.prod.proxy.devspaces.amazon.dev`
