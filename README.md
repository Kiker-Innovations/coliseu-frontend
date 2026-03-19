# Coliseu Frontend

App web para moradores, administradores e porteiros de condomínios.

## Tech Stack

- React 18 + TypeScript + Vite 6
- Tailwind CSS + shadcn/ui
- React Router 6 + React Query 5
- React Hook Form + Zod
- PWA (Workbox, offline support)

## Setup

```bash
npm install
npm run dev
```

## Variável de Ambiente

```
VITE_API_URL=http://localhost:3000/api/coliseu
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build produção |
| `npm run build:dev` | Build desenvolvimento |
| `npm run preview` | Preview da build |
| `npm run lint` | Formatar com Biome |
| `npm run lint:check` | Checar regras Biome |

## Funcionalidades

### Morador
- Dashboard com resumo financeiro
- Enquetes e votação
- Acompanhamento de progresso de projetos
- Documentos, avisos, encomendas
- Reservas de áreas comuns
- Multas e infrações
- Perfil e ajuda

### Administrador
- Dashboard com estatísticas
- Gestão financeira (receitas, despesas recorrentes e pontuais)
- Criação de enquetes e votações
- Gestão de porteiros, documentos, avisos
- Multas e infrações
- Informações do condomínio

### Porteiro
- Dashboard com resumo de encomendas e visitantes
- Registro e entrega de encomendas
- Registro de visitantes
- Contatos úteis
- Multas (visualização)

## Estrutura

```
src/
├── components/     # UI components (shadcn/ui, layout, auth guards)
├── config/         # API configuration
├── contexts/       # Auth, Network
├── hooks/          # Custom hooks
├── pages/          # Páginas por role (resident, admin, concierge)
├── schemas/        # Validação Zod (espelha pages/)
├── services/       # API client e services por domínio
└── skeleton/       # Loading skeletons (espelha pages/)
```
