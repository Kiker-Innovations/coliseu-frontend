# Rotas da API - Módulos Project Suggestions e Project Suggestion Polls

Este documento descreve as rotas criadas para os módulos de sugestões de projeto e votação.

## Fluxo do Sistema

1. **Temporada (Season)**: O administrador inicia uma nova temporada
2. **Sugestões dos Moradores (Resident Suggestions)**: Moradores cadastram sugestões durante a temporada
3. **Processamento de Sugestões (Rank Suggestions)**: Administrador executa o processo de ranking que:
   - Remove duplicatas do mesmo morador (mantém a primeira)
   - Identifica duplicatas entre moradores diferentes
   - Rankeia as sugestões por popularidade
   - Cria as `Project Suggestions` prontas para votação
4. **Período de Votação**: Administrador define o período de votação
5. **Votação (Project Suggestion Polls)**: Moradores votam nas sugestões (até 3 votos cada)
6. **Promoção para Projetos**: Administrador transforma as sugestões mais votadas em projetos oficiais

---

## Módulo: Seasons (Rotas Novas)

### POST /v1/seasons/:id/rank-suggestions
**Descrição**: Processa todas as sugestões da temporada, remove duplicatas e cria a lista de sugestões de projeto ranqueadas.

**Acesso**: Apenas administradores

**Parâmetros**:
- `id` (path): ID da temporada (UUID)

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "X sugestões de projeto criadas com sucesso",
  "data": [
    {
      "_id": "uuid",
      "buildingId": "uuid",
      "seasonId": "uuid",
      "title": "Instalar câmeras de segurança",
      "description": "Instalar câmeras em todas as áreas comuns",
      "duplicateCount": 5,
      "rank": 1,
      "votes": 0,
      "votingStartDate": null,
      "votingEndDate": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /v1/seasons/:id/promote-to-projects
**Descrição**: Transforma as sugestões de projeto mais votadas em projetos oficiais.

**Acesso**: Apenas administradores

**Parâmetros**:
- `id` (path): ID da temporada (UUID)
- `topCount` (query, opcional): Quantidade de sugestões a promover (default: 3, min: 1, max: 10)

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "X projetos criados com sucesso",
  "data": [
    {
      "_id": "uuid",
      "buildingId": "uuid",
      "fromSeasonId": "uuid",
      "title": "Instalar câmeras de segurança",
      "description": "Instalar câmeras em todas as áreas comuns",
      "votes": 15,
      "rank": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Módulo: Project Suggestions

### GET /v1/project-suggestions
**Descrição**: Lista todas as sugestões de projeto do prédio na temporada atual.

**Acesso**: Autenticado

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Sugestões de projeto encontradas com sucesso",
  "data": [...]
}
```

---

### GET /v1/project-suggestions/:id
**Descrição**: Busca uma sugestão de projeto específica por ID.

**Acesso**: Autenticado

**Parâmetros**:
- `id` (path): ID da sugestão de projeto (UUID)

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Sugestão de projeto encontrada com sucesso",
  "data": {...}
}
```

---

### PUT /v1/project-suggestions/:id
**Descrição**: Atualiza uma sugestão de projeto existente (apenas antes do início da votação).

**Acesso**: Apenas administradores

**Parâmetros**:
- `id` (path): ID da sugestão de projeto (UUID)

**Body**:
```json
{
  "title": "Novo título",
  "description": "Nova descrição"
}
```

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Sugestão de projeto atualizada com sucesso",
  "data": {...}
}
```

---

### POST /v1/project-suggestions/seasons/:seasonId/start-voting
**Descrição**: Define o período de votação para as sugestões de projeto de uma temporada.

**Acesso**: Apenas administradores

**Parâmetros**:
- `seasonId` (path): ID da temporada (UUID)

**Body**:
```json
{
  "votingStartDate": "2025-01-01T00:00:00.000Z",
  "votingEndDate": "2025-01-15T23:59:59.999Z"
}
```

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Período de votação definido com sucesso",
  "data": [...]
}
```

---

### DELETE /v1/project-suggestions/:id
**Descrição**: Deleta uma sugestão de projeto existente.

**Acesso**: Apenas administradores

**Parâmetros**:
- `id` (path): ID da sugestão de projeto (UUID)

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Sugestão de projeto deletada com sucesso",
  "data": null
}
```

---

## Módulo: Project Suggestion Polls

### POST /v1/project-suggestion-polls/vote
**Descrição**: Registra ou atualiza o voto de um morador em uma sugestão de projeto. Cada morador tem até 3 votos no total que podem ser distribuídos entre as sugestões.

**Acesso**: Apenas moradores (autenticados)

**Body**:
```json
{
  "projectSuggestionId": "uuid",
  "voteCount": 2
}
```

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Voto registrado com sucesso",
  "data": {
    "id": "uuid",
    "projectSuggestionId": "uuid",
    "voteCount": 2,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Regras de votação**:
- Cada morador tem até 3 votos no total
- Os votos podem ser distribuídos livremente:
  - 3 votos em uma única sugestão
  - 2 votos em uma e 1 em outra
  - 1 voto em até 3 sugestões diferentes
- Votação só é permitida durante o período definido pelo administrador

---

### DELETE /v1/project-suggestion-polls/:projectSuggestionId/vote
**Descrição**: Remove o voto de um morador em uma sugestão de projeto.

**Acesso**: Apenas moradores (autenticados)

**Parâmetros**:
- `projectSuggestionId` (path): ID da sugestão de projeto (UUID)

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Voto removido com sucesso",
  "data": null
}
```

---

### GET /v1/project-suggestion-polls/my-votes
**Descrição**: Retorna todos os votos do morador autenticado na temporada atual, incluindo quantos votos foram usados e quantos restam.

**Acesso**: Apenas moradores (autenticados)

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Votos encontrados com sucesso",
  "data": {
    "totalVotesUsed": 2,
    "votesRemaining": 1,
    "votes": [
      {
        "id": "uuid",
        "projectSuggestionId": "uuid",
        "voteCount": 2,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /v1/project-suggestion-polls/:projectSuggestionId/my-vote
**Descrição**: Retorna o voto do morador autenticado em uma sugestão de projeto específica.

**Acesso**: Apenas moradores (autenticados)

**Parâmetros**:
- `projectSuggestionId` (path): ID da sugestão de projeto (UUID)

**Resposta de sucesso** (200):
```json
{
  "success": true,
  "message": "Voto encontrado com sucesso",
  "data": {
    "id": "uuid",
    "projectSuggestionId": "uuid",
    "voteCount": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Entidades Criadas

### ProjectSuggestion
```typescript
{
  _id: string;
  buildingId: string;
  seasonId: string;
  title: string;
  description: string;
  duplicateCount: number;  // Quantidade de moradores diferentes que sugeriram o mesmo
  rank: number;            // Posição no ranking
  votes: number;           // Total de votos recebidos
  votingStartDate?: Date;
  votingEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### ProjectSuggestionPoll
```typescript
{
  _id: string;
  projectSuggestionId: string;
  residentId: string;
  voteCount: number;  // Quantidade de votos atribuídos (1-3)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Collections MongoDB

Novas collections adicionadas ao `env.ts`:
- `projectSuggestions`: Armazena as sugestões de projeto processadas
- `projectSuggestionPolls`: Armazena os votos dos moradores nas sugestões

