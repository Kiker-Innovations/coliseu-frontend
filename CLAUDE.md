# Coliseu Frontend

App web para moradores, administradores e porteiros de condomínios da plataforma Coliseu.

## Tech Stack

- **React 18.3** + **TypeScript 5** + **Vite 6**
- **Tailwind CSS 3** + **shadcn/ui** (Radix UI)
- **React Router 6** - Rotas SPA
- **React Query 5** - Estado assíncrono
- **React Hook Form 7** + **Zod 3** - Formulários e validação
- **Biome** - Linting/formatting
- **PWA** - vite-plugin-pwa com Workbox (offline, cache, install prompt)

## Comandos

```bash
npm run dev          # Dev server (porta via VITE_PORT ou 8080)
npm run build        # Build produção
npm run build:dev    # Build desenvolvimento
npm run preview      # Preview da build
npm run lint         # Formatar com Biome
npm run lint:check   # Checar regras Biome
```

## Variável de Ambiente

```
VITE_API_URL=http://localhost:3000/api/coliseu
```

## Arquitetura

### 3 Roles de Usuário

| Role | Login | Layout | Sidebar |
|------|-------|--------|---------|
| Resident | `/login` | `AppLayout` | `AppSidebar` |
| Admin | `/admin/login` | `AppLayoutAdmin` | `AppSidebarAdmin` |
| Concierge | `/concierge/login` | `AppLayoutConcierge` | `AppSidebarConcierge` |

### Rotas e Páginas

**Resident**: Dashboard, Progress, Poll, Fines, Documents, Packages, Bookings, Notices, Profile, Help
**Admin**: Dashboard, Financial, Voting, Polls, CondominiumInfo, Fines, Notices, Documents, Concierge (CRUD), Profile, Help
**Concierge**: Dashboard, Packages, Fines, Visitors, Contacts, Help

### Autenticação

- JWT com access + refresh token
- Storage: localStorage (remember me) ou sessionStorage
- Token contém `accessiblePages` (array com url, icon, order) que define sidebar dinamicamente
- Validação por tipo: `/v1/auth/validate/{resident|concierge|admin}`
- `ProtectedRoute` por role, `ProtectedPageRoute` por accessiblePages do JWT
- `ProtectedStatusRoute` com acesso temporário de 5 min (registro)

### Estrutura de Pastas

```
src/
├── components/
│   ├── auth/          # ProtectedRoute, ProtectedPageRoute
│   ├── layout/        # AppLayout*, AppSidebar* (por role)
│   ├── network/       # NetworkErrorState
│   ├── pwa/           # InstallPrompt
│   └── ui/            # shadcn/ui (65+ componentes)
├── config/            # api.config.ts (baseURL, timeout, storage keys)
├── contexts/          # AuthContext, NetworkContext
├── hooks/             # use-auth, use-accessible-pages, use-network-status, use-mobile, use-api-request
├── lib/               # utils.ts (cn helper)
├── pages/
│   ├── resident/      # Páginas do morador + auth/
│   ├── admin/         # Páginas do admin + auth/
│   └── concierge/     # Páginas do porteiro + auth/
├── schemas/           # Zod schemas (espelham estrutura de pages/)
├── services/
│   ├── auth.service.ts    # Login/logout/validate (3 roles)
│   └── api/
│       ├── client.ts      # HTTP client (retry, timeout, cache, offline)
│       ├── types.ts       # ApiResponse, ApiError
│       └── *.service.ts   # Services por domínio
├── skeleton/          # Loading skeletons (espelham pages/)
└── assets/
```

### API Client (`services/api/client.ts`)

- Retry com exponential backoff (max 3 tentativas, apenas GET)
- Timeout: 30s via AbortController
- Cache: localStorage com TTL 5 min (prefixo `coliseu_cache_`)
- Token injection automático (Bearer)
- Fallback offline: retorna cache em caso de NetworkError

### Schemas de Validação

Schemas Zod em `src/schemas/{role}/{feature}.schema.ts`, espelhando a estrutura de `pages/`.
Usados com react-hook-form via `@hookform/resolvers/zod`.

### PWA

- Service worker com Workbox
- Estratégias de cache: NetworkFirst (pages, API), CacheFirst (images), StaleWhileRevalidate (styles)
- InstallPrompt com dismiss de 7 dias
- Suporte iOS (Safari share prompt)

### Deploy

- Netlify: `_headers`, `_redirects` em `public/`
- Cloudflare: `_routes.json` em `public/`

## Convenções

- Sem comentários no código
- camelCase para nomes de arquivo
- shadcn/ui para componentes UI (não criar do zero)
- Skeleton loading para cada página
- Toast (Sonner) para feedback ao usuário
- Resposta da API: `{ success: boolean; message: string; data: T }`
