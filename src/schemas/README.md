# Schemas

Esta pasta contém todos os schemas de validação do sistema, espelhando a estrutura da pasta `/pages`.

## Estrutura

```
schemas/
├── admin/
│   ├── auth/
│   │   ├── login.schema.ts
│   │   └── reset-password.schema.ts
│   ├── financial.schema.ts
│   ├── recurring-expense.schema.ts
│   └── voting.schema.ts
└── resident/
    ├── auth/
    │   ├── login.schema.ts
    │   ├── register.schema.ts
    │   └── reset-password.schema.ts
    └── suggestions.schema.ts
```

## Princípio

Cada página que possui um formulário deve ter seu schema correspondente de validação seguindo a mesma estrutura de diretórios.

## Convenção de Nomenclatura

- **Arquivo**: `{funcionalidade}.schema.ts`
- **Exportação**: `{funcionalidade}Schema` e `{Funcionalidade}Schema` (tipo)

## Exemplos

### Schema de Login do Residente
**Localização**: `schemas/resident/auth/login.schema.ts`
```ts
import { z } from "zod";

export const loginSchema = z.object({
  apartment: z.string().min(1, "Apartamento é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
```

**Uso na Página**: `pages/resident/auth/Login.tsx`
```ts
import { loginSchema, type LoginSchema } from "@/schemas/resident/auth/login.schema";

const { register, handleSubmit } = useForm<LoginSchema>({
  resolver: zodResolver(loginSchema),
});
```

### Schema de Login do Admin
**Localização**: `schemas/admin/auth/login.schema.ts`
```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
```

**Uso na Página**: `pages/admin/auth/Login.tsx`
```ts
import { loginSchema, type LoginSchema } from "@/schemas/admin/auth/login.schema";
```

## Regras

1. **Espelhar a estrutura**: O caminho do schema deve seguir exatamente o caminho da página
2. **Um schema por formulário**: Cada formulário deve ter seu próprio schema
3. **Reutilização**: Se dois formulários são idênticos mas em contextos diferentes (resident vs admin), crie schemas separados para facilitar manutenção futura
4. **Validação completa**: Schemas devem incluir todas as validações necessárias (required, format, min/max, etc)

## Manutenção

Ao criar uma nova página com formulário:
1. Crie o schema em `schemas/` seguindo o caminho da página
2. Nomeie o arquivo como `{funcionalidade}.schema.ts`
3. Exporte o schema e o tipo com nomes consistentes
4. Importe corretamente na página usando o caminho completo

## Benefícios

- ✅ Organização clara e previsível
- ✅ Fácil localização de schemas
- ✅ Manutenibilidade aprimorada
- ✅ Separação de concerns (admin vs resident)
- ✅ Reutilização facilitada quando apropriado

