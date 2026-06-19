---
name: gestao-turmas-front-context
description: Mapa fiel da codebase do front-end Gestão de Turmas — estrutura real de pastas, módulos de domínio existentes, padrões adotados e dívidas técnicas conhecidas. Reflete o código em junho/2026. Para regras, ver AGENTS.md e os SKILLs.
---

# Contexto da Codebase — Gestão de Turmas Front-end

App Angular 21 (standalone) para administração de turmas. Consome uma API .NET em `https://localhost:7048/api`. Foco atual: módulos de **Aluno** (CRUD completo, paginado e filtrável) e **Docente** (listagem read-only). Disciplinas e Turmas ainda não têm tela.

## 1. Stack

Angular 21 · TypeScript estrito (`strict`, `strictTemplates`, `noPropertyAccessFromIndexSignature`) · RxJS 7.8 · SCSS · `@ngx-translate/core` 17 (loader HTTP) · Vitest 4.

## 2. Estrutura real de `src/app/`

```
app.ts / app.html / app.scss      Root standalone. Inicializa i18n no constructor; usa signal() p/ title.
app.config.ts                     provideRouter + provideHttpClient + provideTranslateService (loader HTTP, fallback pt-BR).
app.routes.ts                     Lazy loading REAL: 'alunos' e 'docentes' via loadChildren; '' → 'alunos'.

core/
  services/    aluno.service.ts        HTTP puro do domínio Aluno (CRUD + inativar/reativar). Monta HttpParams via reduce.
               docente.service.ts      HTTP puro do domínio Docente (lista sem paginação).
  facades/     aluno-facade.service.ts BehaviorSubject de estado de filtro/página + resultado$ derivado (switchMap). Métodos de intenção.
               docente-facade.service.ts  Wrapper read-only com shareReplay({bufferSize:1, refCount:true}).

features/                         Componentes SMART de domínio, um diretório por feature. Cada um traz seu *.routes.ts (lazy).
  aluno/        aluno-index.component.ts   SMART. Lista paginada + modal CRUD + filtros + alertas. + aluno.routes.ts.
  docente/      docente-index.component.ts SMART minimalista (só docentes$ | async). + docente.routes.ts.
  login/        login.component.ts         SMART. Form de login + alerta.

shared/                           SÓ o genuinamente reutilizável (Dumb components + contratos + utilitários).
  components/
    tabela-generica/              DUMB genérico <T extends EntidadeBaseInterface>. Colunas/ações configuráveis.
    filtro-lista.component/       DUMB reativo. valueChanges + debounce(300) + distinctUntilChanged → acaoFiltrar.
    paginacao.component/          DUMB stateless. Getters computados; emite mudarPagina(n).
    form-field-text.component/    DUMB + ControlValueAccessor.
    form-field-select.component/  DUMB + ControlValueAccessor (preserva tipo do value).
    modal/                        DUMB. <dialog> nativo via ViewChild + ngOnChanges. Two-way [(visivel)].
    mensagem.component/           DUMB. Toast de alerta. Two-way [(visivel)].
    botao/                        DUMB. variante/tipo/tamanho; emite acaoBotao.
    nav-bar.component/            DUMB de navegação + trocarIdioma() (i18n global via translate.use()).
  interfaces/                     Contratos de dados, agrupados por papel (ver SKILL-data-modeling-contracts.md):
    dto/                          Contratos de ESCRITA (payload p/ servidor): aluno-adicionar/editar, login.
    entities/                     Domínio (contrato de leitura): entidade-base, aluno, docente-sql, usuario-autenticado.
    ui/                           Genéricos de tela: tabela-coluna, acao/evento-tabela, select-option/filter,
                                    filtro-lista, aluno-filtro, resultado-paginado, alerta-state.
  models/                         EntidadeBaseModel, AlunoModel — classes concretas, NÃO instanciadas em runtime (dívida D6).
  enums/        sexo.enum.ts      SexoEnum numérico (MASCULINO=1, FEMININO=2, OUTRO=3).
  pipes/        cpf-cnpj · sexo-format · error-message  (pipes retornam CHAVE i18n, não texto traduzido).
  validators/   cpf-cnpj.validator.ts (Módulo 11) · idade.validator.ts.
  utils/        cpf-cnpj.utils.ts (formatarCpfCnpj).
```

> **Regra de fronteira `features/` vs. `shared/`:** componente SMART (injeta Facade, conhece o domínio, carrega rota) mora em `features/<dominio>/`. Componente DUMB reutilizável (só `@Input()/@Output()`) mora em `shared/components/`. Contratos de dado vão em `shared/interfaces/{dto,entities,ui}/` conforme o papel.

## 3. Padrões adotados (a norma a seguir)

- **Roteamento:** lazy por domínio (`loadChildren` no root → `loadComponent` na rota do módulo). Domínios novos seguem o mesmo molde de `aluno.routes.ts`.
- **Camadas:** Component (Smart) → Facade (estado + orquestração) → Service (HTTP puro). Veja a Skill `state-and-data-flow`.
- **Leitura reativa:** lista exposta como `Observable` e consumida com `async pipe`. **Mutação** (adicionar/editar/inativar) via `subscribe()` gerenciado por `takeUntilDestroyed`. A distinção query↔command está na Skill `rxjs-reactive-patterns`.
- **Componentes de campo:** implementam `ControlValueAccessor` para entrar em Reactive Forms tipados. Veja a Skill `component-design`.
- **Estado coeso:** alertas/modais como objetos (`AlertaState`), não como propriedades soltas.
- **i18n:** centralizado em `public/i18n/*.json`; componentes/pipes referenciam chaves.

## 4. Dívidas técnicas conhecidas (padrões-alvo, NÃO bugs em produção)

Não "corrija" estes itens sem solicitação explícita. Estão listados para que novas features já nasçam melhores e para orientar refactors quando pedidos.

- **D1 — OnPush ausente.** Nenhum componente usa `ChangeDetectionStrategy.OnPush`. Alvo: adicionar em componentes novos; migrar os existentes quando tocados. (O `AlunoIndex` usa `subscribe()`/`tap()`, então OnPush ali exige cuidado com CD manual.)
- **D2 — `any` residual.** `TabelaColuna.formatador/cssClassCelula` e `AcaoTabela.condicaoVisibilidade` usam `(valor: any)`; os callbacks CVA (`onChange`/`onTouched`) também. Alvo: genéricos (`<T>`) e tipos de função.
- **D3 — Estado modal não-discriminado.** `AlunoIndex` guarda `modoModal: 'adicionar'|'editar'` + `alunoEmEdicao: AlunoInterface|null` separados, com `!` em `alunoEmEdicao!.id`. Alvo: discriminated union (`{ modo: 'adicionar' } | { modo: 'editar'; aluno: AlunoInterface }`).
- **D4 — i18n incompleto no Docente.** `docente-index` mistura chaves (`TABELA.COLUNAS.ALUNO.NOME`) com strings hardcoded (`'Id'`, `'Disciplina'`, `'Carga Horária'`) e reaproveita chaves de Aluno. Alvo: chaves próprias de Docente.
- **D5 — `[control]` como Input coexiste com CVA.** Os form-fields implementam CVA, mas ainda recebem `@Input() control?` para exibir erro. É um híbrido consciente; o caminho-alvo é o componente derivar o estado de erro do próprio CVA/`NgControl`.
- **D6 — Models concretos sem uso em runtime.** `AlunoModel`/`EntidadeBaseModel` existem mas o domínio flui inteiramente por interfaces e DTOs; nada instancia essas classes. Mantê-las apenas se surgir necessidade real (factory/defaults); caso contrário são candidatas a remoção.
- **D7 — `apiUrl` hardcoded** no service (`https://localhost:7048/...`). Alvo: mover para `environment`/token de configuração.

## 5. Scripts

`npm start` (ng serve) · `npm run build` · `npm run watch` · `npm test` (Vitest).

## 6. Onde ler as regras

`AGENTS.md` (global — sempre carregado: princípios, três camadas, reflexos-gatilho, ordem de prioridade) · Skills em `.claude/skills/`: `component-design` · `state-and-data-flow` · `rxjs-reactive-patterns` · `data-modeling-contracts`.
