# Guía de Despliegue Local - Gestión de Salas M365 + Supabase

Esta guía te ayudará a configurar y ejecutar el proyecto en tu máquina local.

## 1. Requisitos Previos
- **Node.js** (v18 o superior)
- **npm** o **pnpm**
- Una cuenta de **Supabase**
- Una suscripción de **Microsoft 365** (con permisos para registrar aplicaciones en Azure AD)

## 2. Configuración en Microsoft Azure (Azure AD)
1. Ve al [Portal de Azure](https://portal.azure.com/) > **Entra ID (Active Directory)** > **App registrations**.
2. Registra una nueva aplicación:
   - **Redirect URI**: `https://knulustsdmfhnwykhbqk.supabase.co/auth/v1/callback` (Reemplaza con tu URL de Supabase si es distinta).
3. En **Authentication**, habilita **Access tokens** e **ID tokens**.
4. En **API Permissions**, añade:
   - `User.Read`
   - `User.Read.All`
   - `Calendars.ReadWrite`
   - `Place.Read.All`
   - `offline_access`
5. Crea un **Client Secret** y guárdalo.

## 3. Configuración en Supabase
1. Ve a tu proyecto en Supabase > **Authentication** > **Providers** > **Azure**.
2. Habilita el proveedor e introduce:
   - **Client ID** (de Azure)
   - **Client Secret** (de Azure)
   - **Tenant ID** (de Azure)
3. Ejecuta el script SQL de `supabase/schema.sql` en el **SQL Editor** de Supabase para crear las tablas y políticas.

## 4. Instalación Local
1. Clona el repositorio (si no lo has hecho).
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz con:
   ```env
   VITE_SUPABASE_URL=https://knulustsdmfhnwykhbqk.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   ```

## 5. Despliegue de la Edge Function
Si deseas usar la funcionalidad de aprobación automática:
1. Instala el CLI de Supabase.
2. Inicia sesión: `supabase login`.
3. Despliega la función:
   ```bash
   supabase functions deploy handle-approval --project-ref knulustsdmfhnwykhbqk
   ```

## 6. Ejecución del Proyecto
Para iniciar el servidor de desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---
**Nota**: Para probar la integración con Microsoft, asegúrate de que el usuario que inicie sesión tenga permisos suficientes en el tenant de M365.
