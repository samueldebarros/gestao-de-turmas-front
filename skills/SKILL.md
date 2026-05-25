---
name: gestao-turmas-front-skill-architecture
description: Guia de arquitetura local e padrões de implementação para o front-end. Detalha regras de smart/dumb components, reatividade com RxJS, tratamento de DTOs e internacionalização (i18n).
---

## Objetivo

- Guia de regras de arquitetura local para este repositório
- Suplemento a `AGENTS.md`; não substitui diretrizes globais

## Estrutura padrão

- `src/app/core/`: serviços singleton e integração HTTP
- `src/app/shared/`: componentes de UI, modelos, enums, validadores
- `src/app/features/`: domínios isolados com componentes e serviços próprios

## Componentes

- Smart components controlam estado, formulários e serviços
- UI components são puros, apenas inputs/outputs e renderização
- Use componentes pequenos e um único propósito por arquivo
- Exponha propriedades `readonly` quando não forem mutadas
- Prefira standalone components e `ChangeDetectionStrategy.OnPush`

## Reatividade e HTTP

- Use `Observable` em serviços e `async pipe` em templates
- Não use `.subscribe()` para renderização de dados
- Use `Subject<void>` + `startWith(void 0)` para refresh de listas
- Use `switchMap()` e `catchError()` para chamadas HTTP
- Centralize lógica de persistência em `core/services/`

## Modelos e contratos

- Não use prefixo `I` em interfaces
- Separe `Interface` de `Model` e `DTO`
- Use `DTO` para envio de dados em POST/PUT
- Enum numérico deve mapear ao contrato API
- Não hardcode descrições de enum; use i18n

## i18n e mensagens

- Todas strings UI devem estar em arquivos `public/i18n/*.json`
- Use chaves i18n nos componentes e validadores
- Não escreva texto estático em componentes quando houver chave disponível

## Referências específicas

- Para padrões RxJS e integração HTTP, consulte `skills/SKILL-rxjs-reactive-patterns.md`
- Para modelagem de dados, enums e DTOs, consulte `skills/SKILL-data-modeling-contracts.md`
- Para regras gerais de Angular e acessibilidade, consulte `AGENTS.md`
