# VIBEverse - Requerimientos de Backend y Midway

> Documento de arquitectura basado en las rutas oficiales internas de Amazon
> (Midway, Isengard, BuilderHub, clasificacion de datos). Fuentes citadas al final.

## 1. Resumen de la arquitectura (paved path)

```
                       Midway SSO (midway-auth.amazon.com)
                                    |
   Navegador (SEPO) --- id_token cookie (amzn_sso_token, ~15 min) ---.
        |                                                            |
        v                                                            v
  [ CloudFront + CloudFrontSigner ]                       [ API Gateway REST ]
   Midway en el edge, sirve la SPA                         + Amazon Lambda
        |                                                    Interceptor (ALI)
        v                                                    autorizer Midway
     [ S3 ]  assets React (build)                                  |
                                                                   v
                                                            [ Lambda (handlers) ]
                                                                   |
                                                    .--------------+--------------.
                                                    v                             v
                                             [ DynamoDB ]                     [ S3 ]
                                          (KMS-encrypted)                  imagenes flyers
```

**Decisiones clave (todas paved path):**

| Pieza | Servicio elegido | Por que |
|---|---|---|
| Auth de la SPA | **CloudFrontSigner** (Midway en el edge) | Solucion preferida para apps internas estaticas/SPA |
| Auth de la API | **Amazon Lambda Interceptor (ALI)** como Lambda Authorizer | Paved path AppSec-reviewed; valida el JWT de Midway; ~1-10ms p99 |
| Hosting SPA | **S3 + CloudFront + dominio SuperNova** | Golden path actual para sitios internos |
| Compute | **Lambda** (API Gateway REST) | Serverless, costo casi nulo para 1800 usuarios |
| Datos | **DynamoDB** (KMS) | Serverless, escala solo |
| Imagenes | **S3** (KMS) | Flyers subidos por admin |
| Dominio | **SuperNova** (ej. `sepo.<org>.amazon.dev`) | El endpoint `execute-api` NO esta allowlisted en Midway |

> No existe UNA sola plantilla que junte todo. El paved path son **dos apps**:
> (1) frontend React con Midway edge, (2) backend Coral/Lambda con ALI + DynamoDB.

## 2. Flujo de autenticacion Midway (paso a paso)

1. Usuario abre `https://sepo.<org>.amazon.dev`. CloudFrontSigner detecta que no hay
   sesion Midway y redirige a `midway-auth.amazon.com`; el usuario ya tiene sesion
   corporativa, asi que vuelve con la cookie `amzn_sso_token` (id_token OIDC, ~15 min).
2. CloudFront sirve la SPA (assets desde S3) solo despues de validar Midway.
3. La SPA llama a la API con `credentials: 'include'` (manda la cookie Midway).
   Se recomienda incluir el helper interno `Openid.xhr.js` / `sentryFetch` para
   manejar el handshake SSO/CORS de forma transparente en XHR.
4. **ALI** (Lambda Authorizer en API Gateway) valida el JWT de Midway:
   - firma contra las llaves publicas de Midway (JWKS)
   - issuer = `https://midway-auth.amazon.com`
   - audience / `clientId` = tu dominio API allowlisted `https://<api-domain>:443`
   - expiracion
   - bloquea headers `X-FORWARDED-USER` spoofeados (401)
5. El handler Lambda lee el alias del caller desde
   `event.requestContext.authorizer.principalId`. **Nunca** confia en headers del cliente.
6. **Autorizacion de roles** (colaborador/manager/sepo_manager/admin): la hace NUESTRO
   codigo, consultando la tabla `vibe-roles` con el alias del paso 5. Midway solo
   autentica (quien eres), no autoriza (que puedes hacer).

**clientId de ALI:** es tu dominio de API allowlisted, formato `https://<api-domain>:443`.
Se registra en **SuperNova** y se pone como custom domain del API Gateway.

Wiring de ALI (CDK, del paquete `@amzn/amazon-authorizer-constructs`):
```
new MidwayAuthorizer(scope, 'MidwayAuthorizer', {
  clientId: 'https://<api-domain>:443',
  restApi: restApi,
})
```

**Caveats importantes:**
- ALI fuerza que TODAS las rutas de ese API Gateway sean Midway-protegidas.
- CORS necesita config explicita (sin wildcard con credentials; preferir que web y
  API sean same-site, ej. `sepo.<org>.amazon.dev` y `sepo-api.<org>.amazon.dev`).
- Poner el `description` del REST API dinamico (timestamp) para evitar 500 por
  authorizer stale. No activar execution logs de API Gateway en prod.

## 3. Contrato de la API (ya congelado en `src/lib/api.js`)

Todas requieren sesion Midway. El rol se resuelve server-side por alias.

| Metodo | Ruta | Acceso | Funcion |
|---|---|---|---|
| GET | `/me` | cualquiera | `{ login, role }` (resuelve rol desde `vibe-roles`) |
| GET | `/content/:section` | cualquiera | lista items (`flyers`,`news`,`links`,`events`) |
| POST | `/content/:section` | admin | crear item |
| PUT | `/content/:section/:id` | admin | editar item |
| DELETE | `/content/:section/:id` | admin | borrar item |
| GET | `/rewards` | sepo_manager+ | nominaciones (admin ve todas; manager las suyas) |
| POST | `/rewards` | sepo_manager+ | crear nominacion (valida ventana de fecha) |
| POST | `/uploads` | admin | sube imagen a S3, devuelve URL |
| GET | `/roles` | admin | lista allowlist de roles |
| PUT | `/roles/:login` | admin | asigna rol |
| DELETE | `/roles/:login` | admin | quita rol (vuelve a colaborador) |

Cada mutacion re-verifica el rol server-side (defensa en profundidad; el ocultar
tabs en el frontend es solo UX, no seguridad).

## 4. Modelo de datos (DynamoDB)

Single-table opcional, pero para claridad usamos tablas separadas:

```
Tabla: vibe-content
  PK: SECTION#<flyers|news|links|events>
  SK: <id>
  attrs: (segun seccion) title, body, image, link, isHome, date, tag,
         pinned, url, icon, category, managerOnly, type, owner, live
  GSI: opcional por fecha para eventos

Tabla: vibe-roles
  PK: USER#<login>
  attrs: role (collaborator|manager|sepo_manager|admin), updatedBy, updatedAt
  (default: si no existe la fila, el usuario es 'collaborator')

Tabla: vibe-rewards
  PK: PERIOD#<cadence>#<period>   (ej. PERIOD#Monthly#July 2026)
  SK: REW#<id>
  attrs: cadence, award, period, nominee, reason, nominatedBy,
         nominatedAt, status (Approved|Acknowledged), acknowledgedBy
  GSI1: PK=NOMINATOR#<login> para "mis nominaciones"

Tabla: vibe-deadlines
  PK: CADENCE#<Weekly|Monthly|Quarterly|Annual>
  SK: PERIOD#<period>
  attrs: dueAt (ISO UTC), custom (bool), note, createdBy
  (si no hay override, se calcula default: cierre 17:00 hora Costa Rica UTC-6)
```

Notas de la extension original que reusamos:
- Hora fijada a **Costa Rica (UTC-6, sin DST)** para deadlines de R&R.
- `birthdays` y `hireDates` (amaversarios) son datos de solo lectura importados
  de los CSV/TSV existentes.

## 5. Clasificacion de datos (obligatorio antes de lanzar)

VIBEverse es un servicio **Confidential** (posiblemente Highly Confidential segun
DoB). Datos que guardamos y su tier:

| Dato | Clasificacion | Nota |
|---|---|---|
| login / alias | Confidential | Amazon Employee ID |
| manager alias | Public -> Confidential | atributo de directorio |
| aniversario laboral | Public -> Confidential | |
| nombre empleado | Public | |
| **cumpleanos (dia + mes)** | cuidado | DoB completo = **Highly Confidential**. Guardamos SOLO dia+mes (sin ano) para bajar sensibilidad |

**Controles obligatorios:**
- Encriptacion en reposo: **KMS** (DynamoDB + S3). La feature de DynamoDB de
  BuilderHub ya viene KMS-encrypted.
- Encriptacion en transito: **TLS 1.2+** (CloudFront/API GW por defecto).
- Acceso: **Midway-gated** + RBAC need-to-know (ya lo tenemos).
- **ASR** (Application Security Review) + atestacion de privacidad **Kale**.
- Correr cada campo por **DACE** (`classify.corp.amazon.com`) y registrar el
  roll-up en el ASR ANTES de lanzar.
- **No guardar el ano de nacimiento** (dia+mes es suficiente y evita Highly
  Confidential Specific HR PII).

## 6. Plan de accion (orden concreto)

### Fase A - Cuenta e infra base
- [ ] Crear cuenta(s) AWS internas via **Merlon** (`iad.merlon.amazon.dev/create-account/aws`).
      Elegir **Service account** (team-owned, requiere CTI con resolver group).
      Idealmente 3 stages: alpha / beta / prod.
- [ ] Crear/asociar un **Bindle** del equipo (`bindles.amazon.com`).
- [ ] Registrar dominios en **SuperNova**: `sepo.<org>.amazon.dev` (web) y
      `sepo-api.<org>.amazon.dev` (API). ACM cert en `us-east-1` para CloudFront.

### Fase B - Backend
- [ ] Crear app desde **BuilderHub Create** con una plantilla foundation de Lambda
      (`foundation-coral-lambda-*`; revisar variantes TypeScript/Python).
- [ ] Agregar features composables: **Custom Midway Lambda Authorizer (ALI)** +
      **DynamoDB Table** (KMS) + observabilidad (CloudWatch).
- [ ] Implementar handlers segun el contrato de la seccion 3.
- [ ] Crear tablas DynamoDB (seccion 4). Seed de roles iniciales + import CSV/TSV.
- [ ] Bucket S3 (KMS) para imagenes; endpoint `/uploads`.

### Fase C - Frontend a produccion
- [ ] Clonar **Katal Mons Website (React)** (`create.hub.amazon.dev/clone/katal-mons-website-react`)
      O adaptar la SPA actual (Vite) a un CDK static-website + CloudFrontSigner.
- [ ] Onboard **CloudFrontSigner** (Midway en el edge).
- [ ] Migrar la SPA actual: cambiar `VITE_API_BASE` al dominio de la API. La capa
      `src/lib/api.js` ya esta lista; el store pasa de localStorage a HTTP.
- [ ] Incluir `Openid.xhr.js` / `sentryFetch` para el handshake SSO en XHR.

### Fase D - Cumplimiento y launch
- [ ] Correr campos por **DACE**; completar **ASR** + **Kale**.
- [ ] Piloto con grupo pequeno de SEPO.
- [ ] Deploy a prod via pipeline; GA a los 1800.

## 7. Que cambia en el codigo actual (frontend)

- `src/lib/api.js` YA define el contrato y adjunta el token Bearer. Hoy `MODE=mock`.
- Al tener backend: setear `VITE_API_BASE=https://sepo-api.<org>.amazon.dev` y
  refactorizar `src/lib/store.jsx` para que `add/update/remove` llamen a `api.*`
  en vez de mutar localStorage.
- El "role switcher" de demo (`src/lib/auth.jsx`) se reemplaza por una llamada
  real a `GET /me` (el rol lo da el backend, no un dropdown).

## 8. Fuentes internas (Amazon)

- ALI (Amazon Lambda Interceptor): https://w.amazon.com/bin/view/AmazonLambdaInterceptor/
- ALI Onboarding: https://w.amazon.com/bin/view/AmazonLambdaInterceptor/Onboarding/
- Midway System Overview (claims, JWKS, 15-min): https://w.amazon.com/bin/view/Midway/SystemOverview/
- Secure Build Path - Midway con Lambda: https://w.amazon.com/bin/view/AWS_Proactive_Security/Security_Readiness/Secure_Build_Paths/Published_Paths/MidwayLambda/
- Static website en CDK + CloudFrontSigner: https://docs.hub.amazon.dev/docs/native-aws/developer-guide/cdk-howto-static-website/
- CloudFrontSigner Onboarding: https://w.amazon.com/bin/view/CloudFrontSigner/Onboarding
- Getting started CDK / Katal Mons React: https://docs.hub.amazon.dev/docs/native-aws/developer-guide/getting-started-cdk/
- BuilderHub Create: https://create.hub.amazon.dev/
- Crear cuenta interna (Isengard/Merlon): https://docs.hub.amazon.dev/docs/native-aws/developer-guide/hello-world-lambda-cdk-test-personal/
- Bindles: https://bindles.amazon.com/
- Data Classification (DACE, ASR): https://w.amazon.com/bin/view/Users/ashiskrj/crashcourse/DataClassification/
- Specific HR PII procedure: https://policy.a2z.com/docs/567641/publication
