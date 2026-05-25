---
name: gestao-turmas-front-context
description: Contexto global da codebase do front-end do sistema Gestão de Turmas. Contém a stack tecnológica (Angular), a estrutura de pastas do repositório e o estado atual da arquitetura.
---

# Contexto da Codebase — Gestão de Turmas Front-end

---

# 1. Visão Geral

O projeto `gestao-turmas-front` é um aplicativo Angular de front-end para gestão de turmas e alunos.
É uma aplicação com foco em cadastro e visualização de turmas, usando componentes compartilhados e formulários reativos.

---

# 2. Objetivo do Projeto

O objetivo principal é oferecer uma interface de administração de turmas com:

- lista de alunos, docentes, disciplinas e turmas
- cadastro, edição e controle de status d
- se comunicar com o projeto em backend com acesso ao banco de dados de alunos

---

# 3. Stack Tecnológica

- Angular
- TypeScript
- SCSS
- RxJS
- Vitest

---

# 4. Estrutura do Repositório

## Arquivos principais

- `angular.json` — configuração do workspace e build.
- `package.json` — dependências e scripts.
- `tsconfig.app.json`, `tsconfig.json`, `tsconfig.spec.json` — configurações TypeScript.
- `README.md` — instruções de uso e build.
- `CONTEXT.md` — contexto do projeto.

## Pasta principal

- `src/` — código-fonte.
  - `main.ts` — bootstrap da aplicação.
  - `index.html` — shell HTML.
  - `styles.scss` — estilos globais.
  - `app/` — aplicação Angular.
    - `app.ts` — componente raiz `App`.
    - `app.html` — template do app.
    - `app.scss` — estilo do app.
    - `app.routes.ts` — rotas da aplicação (atualmente vazio).
    - `app.config.ts` — arquivo de configuração adicional.
    - `app.spec.ts` — teste do app.
    - `core/` — pasta preparada para serviços e providers, atualmente vazia.
    - `features/` — pasta preparada para funcionalidades de domínio, atualmente vazia.
    - `shared/` — componentes e modelos reutilizáveis.
      - `components/` — UI compartilhada.
      - `models/` — interfaces e enums de domínio.

---

# 5. Componentes e Domínio

## Componentes compartilhados

- `shared/components/aluno-index/AlunoIndex` — lista de alunos, modal de cadastro e formulário reativo.
- `shared/components/tabela-generica/TabelaGenerica` — componente genérico de tabela.
- `shared/components/modal/Modal` — componente de diálogo/modal.
- `shared/components/botao/Botao` — componente de botão reutilizável.

## Modelos de domínio

- `shared/models/aluno.interface.ts` — interface `AlunoInterface` estendendo `EntidadeBaseInterface`.
- `shared/models/entidade-base.interface.ts` — `id` e `ativo`.
- `shared/models/sexo.enum.ts` — enum `SexoEnum` com valores `MASCULINO = 1`, `FEMININO = 2` e `OUTRO = 3`.
- `shared/models/tabela-coluna.interface.ts` — interface `TabelaColuna` para colunas de tabela.

---

# 6. Estado atual da aplicação

- A aplicação usa componente raiz `App` que importa `AlunoIndex` diretamente em vez de rotas.
- `app.routes.ts` está definido, mas atualmente não possui nenhuma rota configurada.
- `core/` e `features/` existem como pastas de estrutura, mas ainda não contêm código.
- `AlunoIndex` usa `FormBuilder` e `ReactiveFormsModule` para gestão de formulário.
- Dados de alunos são mantidos em memória dentro do componente.

---

# 7. Scripts de desenvolvimento

- `npm start` — inicia o servidor de desenvolvimento com `ng serve`.
- `npm build` — compila a aplicação.
- `npm watch` — compila em modo observação para desenvolvimento.
- `npm test` — executa testes unitários.

---

# 8. Observações de arquitetura e melhorias

## Padrões atuais

- Uso de componentes standalone no app.
- Uso de formulários reativos (`FormGroup`, `FormControl`, `FormBuilder`).
- Separação inicial entre `shared/components` e `shared/models`.

## Oportunidades de melhoria

- Implementar telas de gestão de Docentes, Disciplinas e Turmas.
- Implementar lazy loading e rotas no `app.routes.ts`.
- Movimentar lógica de negócio e estado para `core/services/`.
- Criar uma feature isolada em `src/app/features/alunos/`.
- Corrigir `styleUrl` para `styleUrls` no `App` e nos componentes para seguir Angular padrão.
- Evitar manter estado da lista de alunos apenas no componente; usar serviço de persistência ou store local.
- Avaliar o uso de Signals apenas para estado interno se o app evoluir, mantendo a comunicação via decoradores tradicionais."

---

# 9. Guia de estilo do projeto

Conforme `project-guidelines/SKILL.md` e `AGENTS.md`:

- Use `kebab-case` para arquivos.
- Use `PascalCase` para classes e enums.
- Prefira componentes pequenos e focados.
- Separe smart components de dumb components.
- Centralize tipos e enums em `shared/models/`.
- Mantenha `core/` para serviços singleton e `features/` para casos de uso.
- Evite lógica de negócio dentro de templates e componentes de UI puros.

---

# 10. Conclusão

Este projeto é uma base Angular moderna com estrutura inicial para expansão.
A principal funcionalidade atual é a gestão de alunos via `AlunoIndex`, com componentes UI reutilizáveis e modelos simples.
O foco natural de evolução é mover a aplicação para rotas de feature, serviços de domínio e persistência mais robusta.
