# Cotiza GZ — Guía de Despliegue

> by Web Artisan

## Arquitectura (100% Gratis)
- **Frontend**: React + Vite → Vercel (static + SSR)
- **Backend**: Vercel Serverless Functions (Node.js 20)
- **Base de datos**: Supabase (PostgreSQL) — Free tier
- **Archivos Neodata**: OneDrive (fuera del sistema, $0)

## Pre-requisitos
- Node.js 20+
- Cuenta de Supabase ([supabase.com](https://supabase.com))
- Cuenta de Vercel ([vercel.com](https://vercel.com))
- Git instalado

---

## 1. Configurar Supabase

1. Crear un nuevo proyecto en [supabase.com](https://supabase.com)
2. Elegir región (ej: `us-east-1`) y poner contraseña para la BD
3. Esperar ~2 minutos a que se provisione
4. Ir a **SQL Editor** → New Query → pegar todo el contenido de `supabase/schema.sql` → **Run**

### Crear usuario admin
7. Ir a **Authentication → Users → Add user**
   - Email: `admin@cotizagz.com`
   - Password: la que desees
8. Copiar el **User UID** generado
9. En **SQL Editor** ejecutar:
   ```sql
   INSERT INTO public.usuarios (auth_id, nombre, email, rol)
   VALUES ('PEGAR-UUID-AQUI', 'Administrador', 'admin@cotizagz.com', 'admin');
   ```

### Copiar credenciales
10. Ir a **Settings → API** y copiar:
    - **Project URL** → `SUPABASE_URL`
    - **anon public key** → `VITE_SUPABASE_ANON_KEY`
    - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Desarrollo Local

### Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de Supabase
npm install
npm run dev
# Backend escuchando en http://localhost:3001
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Editar .env:
#   VITE_SUPABASE_URL=https://xxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=tu-anon-key
#   VITE_API_URL=/api
npm install
npm run dev
# Frontend en http://localhost:3000
# El proxy de Vite redirige /api → localhost:3001
```

---

## 3. Despliegue en Vercel (Gratis)

### Opción A: Desde GitHub (recomendado)
1. Subir el proyecto a un repositorio de GitHub
2. Ir a [vercel.com](https://vercel.com) → **Add New Project**
3. Importar el repositorio
4. Configurar:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (raíz)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install && cd ../backend && npm install`
5. En **Environment Variables** agregar:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_API_URL=/api
   ```
6. Click en **Deploy**

### Opción B: Desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la raíz del proyecto
vercel

# Seguir las instrucciones:
#   - Seleccionar o crear proyecto
#   - Las variables de entorno se configuran en el dashboard de Vercel

# Para producción:
vercel --prod
```

### Configurar SPA Routing
El archivo `vercel.json` ya incluye las reglas necesarias para:
- Enrutar `/api/*` a las Serverless Functions
- Servir el frontend como SPA (client-side routing)

---

## 4. Variables de Entorno

### Frontend (.env / Vercel Dashboard)
| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `VITE_API_URL` | URL base de la API (`/api` siempre) |

### Backend (.env / Vercel Dashboard)
| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase |

---

## 5. Costos

| Servicio | Plan | Límites | Costo |
|----------|------|---------|-------|
| Supabase | Free | 500 MB BD, 50K MAU | $0 |
| Vercel | Hobby | 100 GB bandwidth, serverless functions | $0 |
| **Total** | | | **$0/mes** |

---

## Estructura del Proyecto
```
cotiza-gz/
├── api/                  # Vercel Serverless Functions
│   └── [...path].js      # Catch-all API route
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── context/      # AuthContext
│   │   ├── layouts/      # AppLayout
│   │   ├── pages/        # Páginas por módulo
│   │   ├── services/     # Supabase client, API client
│   │   └── utils/        # Helpers, constantes
│   └── dist/             # Build de producción
├── backend/              # Lógica de negocio (Node.js)
│   └── src/
│       ├── handlers/     # Handlers por módulo
│       ├── utils/        # Supabase client, response helpers
│       ├── index.js      # Router principal
│       └── local-server.js # Dev server local
├── supabase/
│   └── schema.sql        # Esquema completo de BD
└── vercel.json           # Configuración de Vercel
```
