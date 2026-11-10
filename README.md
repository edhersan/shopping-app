# Shopping App — Expo + Vercel Functions

Proyecto académico full-stack: una app móvil de compras con carrito y checkout, respaldada por microservicios serverless desplegables en Vercel (`/api`).

- **Móvil:** React Native con Expo + Expo Router + TypeScript estricto.
- **Backend:** Vercel Functions en Node.js/TypeScript (productos, carrito y órdenes).
- **Persistencia:** catálogo seed en código y órdenes en memoria (se reinician en cada cold start).
- **Monorepo:** npm workspaces.

## Requisitos

- Node.js 20 o superior (probado con Node 24).
- npm 10 o superior.
- Expo Go en un dispositivo, o un emulador Android/iOS.
- (Opcional, para desplegar) cuenta y CLI de Vercel.

## Estructura

```text
shopping-app/
├─ package.json                 # workspaces + entry de Expo + scripts raíz
├─ app.json                     # lanzador raíz → apps/mobile/app
├─ .env.example                 # solo para iniciar Expo desde la raíz
├─ README.md
├─ apps/
│  ├─ mobile/
│  │  ├─ app/                   # Rutas de Expo Router
│  │  │  ├─ _layout.tsx         # Stack + AuthProvider + CartProvider
│  │  │  ├─ login.tsx           # Login demo
│  │  │  ├─ index.tsx           # Catálogo
│  │  │  ├─ cart.tsx            # Carrito
│  │  │  └─ checkout.tsx        # Checkout + pago simulado
│  │  ├─ src/
│  │  │  ├─ components/         # UI modular
│  │  │  ├─ context/            # AuthContext + CartContext
│  │  │  ├─ services/           # Cliente HTTP tipado
│  │  │  ├─ types/              # Contratos TypeScript
│  │  │  └─ utils/              # Moneda, fechas, auth, tasas, tema
│  │  ├─ app.json
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ .env.example
│  └─ services/
│     ├─ api/                   # Vercel Functions
│     │  ├─ health.ts
│     │  ├─ docs.ts             # Swagger UI
│     │  ├─ openapi.ts          # Especificación OpenAPI
│     │  ├─ products/index.ts
│     │  ├─ products/[id].ts
│     │  ├─ cart/validate.ts
│     │  ├─ orders/index.ts
│     │  └─ orders/[id].ts
│     ├─ public/index.html      # Landing del deployment
│     ├─ src/
│     │  ├─ data/products.ts    # Catálogo seed
│     │  ├─ dev/server.ts       # Servidor local sin login de Vercel
│     │  ├─ docs/openapi.ts     # Documento OpenAPI 3.0
│     │  ├─ lib/                # HTTP, errores y validación
│     │  ├─ services/           # Lógica de negocio
│     │  ├─ store/orders.ts     # Órdenes en memoria
│     │  └─ types/
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ vercel.json
│     └─ .env.example
└─ ...
```

Los tipos se declaran por separado en `apps/mobile/src/types` y `apps/services/src/types` para mantener cada app autocontenida; ambos archivos reflejan exactamente el mismo contrato documentado abajo.

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

### 1. Microservicios (puerto 3000)

```bash
npm run services:dev
```

Esto usa un servidor HTTP local (`tsx`) que monta las mismas funciones de `api/` sin requerir login de Vercel.

Alternativa con el runtime real de Vercel (requiere `npx vercel login`):

```bash
npm run services:vercel
```

Verifica el servicio:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products
```

### 2. App móvil

Desde la raíz del monorepo:

```bash
npx expo start
```

También puedes usar `npm start` o iniciar directamente el workspace con `npm run mobile`. La raíz delega en `apps/mobile/app` mediante `extra.router.root`, así que no existen rutas duplicadas: las pantallas y componentes siguen viviendo solo en `apps/mobile`.

Luego abre el QR con Expo Go o presiona `a` para Android / `i` para iOS. Para la vista web usa `npm run mobile:web` (o presiona `w`).

La app apunta por defecto al API desplegado en Vercel:

```text
https://shopping-services-zeta.vercel.app/api
```

Puedes sobreescribir la URL con `EXPO_PUBLIC_API_URL`. Para trabajar con el servidor local:

- Emulador Android: `http://10.0.2.2:3000/api`.
- iOS/web: `http://localhost:3000/api`.
- Dispositivo físico: `http://<IP-LAN-de-tu-PC>:3000/api`.

El archivo `.env` se lee desde el directorio donde se inicia Expo:

- Inicio desde la raíz (`npx expo start` o `npm start`): usa `/.env` (hay un `/.env.example`).
- Inicio con `npm run mobile`: usa `apps/mobile/.env` (hay un ejemplo allí).

```bash
# Ejemplo para usar el servidor local
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

Reinicia Expo con caché limpia tras cambiar el `.env`:

```bash
# desde la raíz
npx expo start --clear

# o dentro del workspace móvil
cd apps/mobile
npx expo start --clear
```

### Inicio de sesión (demo)

La app solicita credenciales antes de mostrar catálogo, carrito y checkout:

- **Usuario:** `expo`
- **Contraseña:** `1234`

La sesión se persiste en AsyncStorage. Desde el encabezado del catálogo puedes cerrar sesión con **Salir**. Las credenciales están definidas en `src/utils/constants.ts` (`DEMO_ACCOUNT`) y la validación en `src/utils/auth.ts`.

### Checkout, tarjeta demo y factura PDF

- La tarjeta de crédito ya viene configurada: **Visa •••• 1111**, titular **Ana Torres**, vence **12/30**. Puedes editarla o restaurarla con **Usar tarjeta**.
- Al confirmar la compra se muestra la pantalla de éxito con el botón **Descargar y mostrar factura PDF**:
  - **Android:** genera el PDF con `expo-print`, solicita autorización para la carpeta elegida (por defecto, Descargas), lo guarda allí y lo abre directamente con el visor PDF del sistema.
  - **iOS:** genera el PDF y lo guarda en los documentos de la aplicación; después abre la hoja del sistema para mostrarlo o guardarlo en otra ubicación.
  - **Web:** abre el diálogo de impresión del navegador con el número de orden como nombre predeterminado; elige **Guardar como PDF**.
- La factura incluye cliente, productos, impuestos, envío, total y los últimos 4 dígitos de la tarjeta.
- Todos los datos de pago son de demostración; no se procesan cargos reales.

## Contrato de API

Todas las respuestas usan el sobre:

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: string[] } };
```

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio |
| GET | `/api/docs` | Swagger UI interactivo |
| GET | `/api/openapi` | Especificación OpenAPI 3.0 (JSON) |
| GET | `/api/products?search=&category=` | Catálogo filtrado |
| GET | `/api/products/:id` | Detalle de producto |
| POST | `/api/cart/validate` | Valida stock y calcula totales |
| POST | `/api/orders` | Crea la orden y simula el pago |
| GET | `/api/orders/:id` | Consulta una orden |

Códigos de error relevantes: `400` validación, `402` pago rechazado, `404` recurso inexistente, `405` método no permitido, `409` stock insuficiente.

### Documentación interactiva (Swagger)

- Página de inicio: `http://localhost:3000/`
- Swagger UI: `http://localhost:3000/api/docs`
- Especificación OpenAPI 3.0: `http://localhost:3000/api/openapi`

En Vercel: `https://<tu-proyecto>.vercel.app/api/docs`. La interfaz carga Swagger UI desde el CDN de unpkg y permite probar los endpoints con **Try it out**.

### Ejemplo: validar carrito

```bash
curl -X POST http://localhost:3000/api/cart/validate \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"p-001","quantity":2}]}'
```

### Ejemplo: crear orden

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "p-005", "quantity": 1}],
    "customer": {
      "fullName": "Ana Torres",
      "email": "ana@example.com",
      "address": "Calle 123 # 45-67",
      "city": "Bogotá",
      "zipCode": "110111"
    },
    "payment": {
      "cardNumber": "4111111111111111",
      "holderName": "Ana Torres",
      "expiry": "12/30",
      "cvv": "123"
    }
  }'
```

## Reglas de negocio

- Impuesto: **8%** sobre el subtotal.
- Envío: **$5.99**; gratis desde **$100**.
- Stock máximo por línea: **99** unidades.
- El servidor recalcula precios y totales; el cliente solo muestra estimaciones.
- Al aprobarse el pago se descuenta el stock del catálogo en memoria.
- Pago simulado: cualquier tarjeta válida aprueba, **excepto** las terminadas en `0000`, que se rechazan con `402`.
- Nunca se almacena el número completo de tarjeta; la orden guarda marca y `last4`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia Expo desde la raíz (equivale a `npx expo start`) |
| `npm run mobile` | Inicia Expo dentro de `apps/mobile` |
| `npm run mobile:android` | Inicia Expo en Android |
| `npm run mobile:ios` | Inicia Expo en iOS |
| `npm run mobile:web` | Inicia Expo en web |
| `npm run services:dev` | Servidor local de microservicios |
| `npm run services:vercel` | `vercel dev` (requiere login) |
| `npm run typecheck` | TypeScript estricto en ambas apps |

## Despliegue en Vercel

1. Sube el repositorio a GitHub/GitLab/Bitbucket.
2. En Vercel, crea un proyecto nuevo e importa el repositorio.
3. Configura **Root Directory** como `apps/services`.
4. Framework Preset: **Other**. No requiere build command ni output directory.
5. Variable de entorno recomendada: `ALLOWED_ORIGIN` (por ejemplo el dominio de tu app o `*` para la demo).
6. Despliega. La API quedará en `https://<tu-proyecto>.vercel.app/api`.
7. La app móvil ya apunta al endpoint actual. Si despliegas otro proyecto, actualiza `EXPO_PUBLIC_API_URL` en el `.env` correspondiente:
   ```bash
   EXPO_PUBLIC_API_URL=https://<tu-proyecto>.vercel.app/api
   ```
8. Reinicia Expo desde `apps/mobile` con `npx expo start --clear`.

Las funciones de `api/` solo usan módulos nativos de Node, por lo que no necesitan dependencias de runtime adicionales en Vercel.

## Persistencia y limitaciones

- El catálogo y las órdenes viven en memoria: cada cold start o redeploy restablece el stock y borra las órdenes.
- El carrito y la sesión demo se persisten en el dispositivo con AsyncStorage.
- El pago y el login son simulaciones académicas; no hay pasarela real ni autenticación de servidor.
- La tarjeta demo se usa solo para la simulación de checkout y la factura PDF.

## Solución de problemas

- **La app no conecta con el API:** por defecto usa `https://shopping-services-zeta.vercel.app/api`; revisa tu conexión. Para el servidor local define `EXPO_PUBLIC_API_URL` con `http://10.0.2.2:3000/api` en Android (nunca `localhost`) o `http://localhost:3000/api` en iOS/web, y asegúrate de que el servicio esté corriendo.
- **CORS:** el servidor responde con `Access-Control-Allow-Origin: *` por defecto; puedes restringirlo con `ALLOWED_ORIGIN`.
- **Puerto ocupado:** define `PORT` antes de `npm run services:dev`.
- **Error `removeChild ... is not a child of this node` en web:** normalmente lo provoca la traducción automática del navegador o una extensión que modifica el DOM. La app fuerza `translate="no"` y `notranslate`; desactiva la traducción del sitio, recarga con `Ctrl+Shift+R` y, en desarrollo, reinicia con `npx expo start --clear`.
- **La factura PDF en web:** se abre el diálogo de impresión con el número de orden como nombre predeterminado; elige **Guardar como PDF**. En Android se solicita autorización para la carpeta donde se guardará y se abre un visor PDF compatible; en iOS se usa el almacenamiento privado de documentos y la hoja de compartir/guardar.
- **Cambios de dependencias en Expo:** usa `npx expo install <paquete>` para obtener versiones compatibles con el SDK.
- **`expo start` no se reconoce:** usa `npx expo start` desde la raíz o instala la CLI de Expo globalmente. El error `expo/AppEntry.js` / `Unable to resolve "../../App"` ya no aplica: la raíz carga `apps/mobile/app` mediante `extra.router.root`.

## Verificación

```bash
npm run typecheck
```

Ambas apps compilan con `strict: true` y sin uso de `any`.
