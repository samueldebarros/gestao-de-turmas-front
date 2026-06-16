---
name: gestao-turmas-front-agents
description: Regras globais de desenvolvimento do front-end Gestão de Turmas. Stack Angular 21 + RxJS 7.8. Define princípios não-negociáveis e roteia o detalhe para os arquivos de SKILL. Leia este arquivo primeiro; ele NÃO repete o conteúdo dos SKILLs.
---

# Regras Globais — gestao-turmas-front

Stack: Angular 21 (standalone, sem NgModule), TypeScript estrito, RxJS 7.8, SCSS, ngx-translate 17, Vitest.

## Princípios não-negociáveis

1. **Feche portas para bugs.** Construa de forma que o compilador e a arquitetura impeçam o erro, em vez de confiar na disciplina de quem escreve. Antes de "como faço isso?", pergunte "como faço de um jeito impossível de usar errado?".
2. **Dono único da informação.** Toda informação tem um único dono. Se você precisa lembrar de atualizar X junto com Y, eles têm o mesmo dono e devem ser uma estrutura só.
3. **Smart vs. Dumb decidido antes de codar.** Pergunta única: o componente sabe de onde vêm os dados e para onde vão os eventos? Se sim, é Smart. Veja a Skill `component-design`.
4. **Contrato antes do interior.** Defina `@Input()`/`@Output()` (a API pública) antes da implementação. O interior é trocável; o contrato não.
5. **`unknown`, nunca `any` por preguiça.** `any` desliga o compilador. Use `unknown` + narrowing, ou genéricos de verdade. Onde `any` ainda existe no código, é dívida (veja `CONTEXT.md`).

## Convenções de código

- **Injeção:** use `inject()` em campo `private readonly`, não por construtor (resumo; detalhe na Skill `rxjs-reactive-patterns`). O construtor fica reservado para inicialização eager — ex.: `app.ts` configura o i18n no construtor.
- **Decorators vs. signals (ressalva fixa do projeto):** o contrato de I/O usa `@Input()`/`@Output()` decorators clássicos por exigência externa — não migre para `input()`/`output()`. `signal()`/`computed()` são permitidos apenas para **estado interno** de componente. Detalhe na Skill `component-design`.
- **Standalone sempre.** Componentes, pipes e diretivas declaram `imports: [...]`; nunca crie NgModule.
- **Imports relativos carregam extensão `.js`** (`'./x.component.js'`) por config do toolchain — mantenha o padrão existente ao editar imports.
- **Strings de UI sempre via i18n.** Nunca hardcode texto visível. Detalhe e exceções na Skill `data-modeling-contracts`.

## Nomenclatura

- Arquivos em `kebab-case` com sufixo de papel: `*.component.ts`, `*.service.ts`, `*.facade.service.ts`, `*.pipe.ts`, `*.validator.ts`, `*.interface.ts`, `*.enum.ts`, `*.model.ts`, `*.utils.ts`, `*.routes.ts`.
- Classes e enums em `PascalCase`; variáveis e métodos em `camelCase` (em português, alinhado ao domínio).
- Interfaces SEM prefixo `I`, COM sufixo `Interface` (`AlunoInterface`). Exceções históricas: DTOs (`AlunoAdicionarDTO`), states (`AlertaState`), enums (`SexoEnum`).

## Acessibilidade

- Passe AXE. Siga WCAG AA para foco, contraste e ARIA.
- Prefira elementos nativos semânticos (ex.: `<dialog>` no Modal) a recriar comportamento com `<div>`.

## As três camadas (regra em uma frase)

> **Component (Smart)** decide e exibe → **Facade** detém o estado e orquestra → **Service** fala HTTP e nada mais.

- O Service nunca tem estado nem `subscribe`; retorna `Observable` frio tipado.
- O Facade detém o estado (ex.: filtro/página num `BehaviorSubject`), expõe leitura como `Observable` e expõe mutação como método de intenção.
- O Component Smart injeta o Facade, liga a leitura no `async pipe` e chama os métodos de intenção. Componentes Dumb não conhecem Facade nem domínio.

## Reflexos-gatilho (pare e repense ENQUANTO digita)

Aplicam-se a qualquer camada. Quando um disparar, a Skill relevante tem a saída.

1. Escreveu `any`? → genérico de verdade (`unknown` + narrowing) ou preguiça de tipar? A questão nunca é o `any`, é **quem valida**.
2. `.value` dentro de um pipe RxJS? → reatividade falsa; derive do stream, não leia snapshot.
3. Setou 2+ propriedades sempre juntas? → é um objeto disfarçado; modele como um.
4. Vai chamar `obj.subject$.next()` de fora da classe dona? → exponha um método de intenção (Tell, Don't Ask).
5. Feature nova exige mexer em 3+ arquivos? → acoplamento; considere parameter object.
6. Escreveu `!` ou `as X`? → promessa não validada em runtime; "se for falsa, onde isto explode?".

## Ordem de prioridade quando em dúvida

1. **Correção estrutural** — fonte única da verdade, encapsulamento, race condition. Bug que o usuário vê.
2. **Contrato e tipos** — `unknown` vs `any`, boundary tipado, parameter object. Define o que o compilador protege.
3. **Disciplina interna** — OnPush, signals, coesão, DRY. Manutenibilidade, não trava produção.

## Roteamento de Skills (onde está o detalhe)

O detalhe operacional vive em **Skills** (`.claude/skills/<nome>/SKILL.md`). Invoque a Skill correspondente ANTES de codar a parte relevante — não confie só nesta tabela.

| Quando você for...                                                     | Invoque a Skill           |
| ---------------------------------------------------------------------- | ------------------------- |
| Decidir Smart/Dumb, criar componente, implementar CVA, two-way binding | `component-design`        |
| Mexer em estado, Facade, paginação, filtro reativo, fluxo de dados     | `state-and-data-flow`     |
| Escrever stream RxJS, chamada HTTP, decidir async pipe vs. subscribe   | `rxjs-reactive-patterns`  |
| Modelar interface, DTO, enum, formulário tipado, validador, i18n       | `data-modeling-contracts` |
| Entender a estrutura do repo, o que existe e as dívidas técnicas       | leia `CONTEXT.md`         |
