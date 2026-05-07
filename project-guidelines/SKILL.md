# Projeto: Gestão de Turmas - Skill Guide

## Objetivo
Este arquivo traz recomendações específicas para a arquitetura e componentes do repositório `gestao-turmas-front`.
Ele complementa as diretrizes gerais de Angular em `AGENTS.md` e serve como referência de projeto quando a IA precisar de detalhes de implementação.

## Estrutura recomendada
- `src/app/core/`
  - Serviços singleton, providers, interceptors e configuração global
- `src/app/shared/`
  - Componentes de UI reutilizáveis, pipes, diretivas e tipos genéricos
- `src/app/features/`
  - Funcionalidades específicas do domínio, com componentes, serviços e modelos próprios

## Diretrizes de componente para este projeto
- Trate `AlunoIndex` como um container/feature component que orquestra dados e ações
- Separe a UI em componentes pequenos e reutilizáveis: `TabelaGenerica`, `Botao`, `Modal`, formulários de aluno
- Extraia lógica de domínio e persistência para serviços em `core/services/`
- Use componentes de apresentação apenas para renderização e emissão de eventos
- Para formularios complexos, prefira componentes de formulário separados e tipados
- Evite usar `$any(...)` em `TabelaGenerica`; prefira tipos `Record<string, unknown>` ou interfaces com campos explícitos

## Pontos de melhoria específicos observados
- `styleUrl` está escrito incorretamente em vários componentes; use `styleUrls`
- `app.routes.ts` está vazio; adicione lazy loaded routes sempre que possível
- `app.ts` não deve importar diretamente um feature component como `AlunoIndex`; use uma rota ou `AppShell`
- `TabelaGenerica` deve ser tipada de forma mais segura para evitar perda de tipo
- `AlunoIndex` mistura lógica de UI com geração de matrícula e atualização de coleção; extraia essa lógica para serviço/helper
- `Modal` deve usar binding de visibilidade e controls acessíveis em vez de `ngOnChanges` sempre que possível
- Componentes devem expor propriedades `readonly` quando o valor não é alterado internamente

## Diretrizes de escalabilidade
- Faça o `shared` ser um catálogo de UI e utilitários, não lógica de negócio
- Crie features isoladas para cada caso de uso, com seus próprios componentes e serviços
- Coloque tipos e enums em `shared/models/` para reutilização centralizada
- Use rotas de feature e lazy loading para separar domínios crescentes
- Faça testes unitários para componentes e serviços críticos de negócio

## Como usar este guia
- Consulte `project-guidelines/SKILL.md` quando precisar de regras de projeto e separação de responsabilidades
- Use `AGENTS.md` para diretrizes gerais de Angular, TypeScript e acessibilidade
- Mantenha o SKILL como um suplemento de projeto, não um substituto das regras globais

---

### Exemplo rápido de fluxo recomendado
1. Criar `features/alunos/aluno-index.component.ts` como container
2. Criar `features/alunos/components/aluno-form.component.ts` para o formulário
3. Criar `shared/components/tabela-generica/tabela-generica.component.ts` para renderização genérica
4. Criar `core/services/aluno.service.ts` para CRUD e lógica de domínio
5. Registrar rota em `src/app/app.routes.ts` e usar lazy loading
