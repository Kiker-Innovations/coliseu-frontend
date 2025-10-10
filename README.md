# Coliseu Condo Voice

Sistema de gestão de condomínios com interface moderna e intuitiva.

## Tecnologias Utilizadas

Este projeto foi construído com:

- **Vite** - Build tool e dev server ultra-rápido
- **TypeScript** - Superset JavaScript com tipagem estática
- **React** - Biblioteca para construção de interfaces
- **shadcn/ui** - Componentes UI de alta qualidade
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Navegação entre páginas
- **React Query** - Gerenciamento de estado assíncrono

## Estrutura do Projeto

```
coliseu-condo-voice/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── layout/      # Componentes de layout
│   │   └── ui/          # Componentes UI do shadcn
│   ├── pages/           # Páginas da aplicação
│   │   └── auth/        # Páginas de autenticação
│   ├── services/        # Serviços e lógica de negócio
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilitários e helpers
│   └── assets/          # Imagens e recursos estáticos
├── public/              # Arquivos públicos
└── ...
```

## Requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

## Instalação

1. Clone o repositório:
```bash
git clone <URL_DO_REPOSITORIO>
cd coliseu-condo-voice
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

4. Abra o navegador em `http://localhost:5173`

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm run build:dev` - Cria a versão de desenvolvimento
- `npm run preview` - Preview da build de produção
- `npm run lint` - Executa o linter

## Funcionalidades

- ✅ Sistema de autenticação (Login/Registro/Recuperação de senha)
- ✅ Dashboard do condomínio
- ✅ Gerenciamento de documentos
- ✅ Sistema de votação
- ✅ Acompanhamento de progresso
- ✅ Sugestões e enquetes
- ✅ Interface responsiva

## Backend e Dados

Atualmente, o projeto utiliza **mocks locais** para simulação de dados e autenticação. Os serviços mockados estão localizados em `src/services/`.

Para conectar a um backend real:
1. Implemente os serviços reais substituindo os mocks em `src/services/`
2. Configure as variáveis de ambiente necessárias
3. Atualize as chamadas de API conforme necessário

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

Este projeto é privado e proprietário.
