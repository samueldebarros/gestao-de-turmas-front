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
               arvore-facade.service.ts   Índice chave→EstadoBuscaFilhos (BehaviorSubject) que É o cache do lazy.
                                            Duas intenções (carregarDocentesDaTurma/carregarAlunosDaTurma) caem em
                                            pedir(): guarda "já busquei?" + Subject + mergeMap (nunca switchMap:
                                            galhos diferentes), catchError DENTRO do achatador. O pedido leva o
                                            buscador como thunk — o Facade não despacha por tipo de entidade.

features/                         Componentes SMART de domínio, um diretório por feature. Cada um traz seu *.routes.ts (lazy).
  aluno/        aluno-index.component.ts   SMART. Lista paginada + modal CRUD + filtros + alertas. + aluno.routes.ts.
  docente/      docente-index.component.ts SMART minimalista (só docentes$ | async). + docente.routes.ts.
  login/        login.component.ts         SMART. Form de login + alerta.
  tree-view/    tree-view-index.component.ts SMART/vitrine. Deriva DUAS árvores em computed (raiz + índice) e é o
                                             único que sabe o que é Turma/Docente/Aluno (rótulos + i18n + guards).
                controle-arvore.ts           Estado de expansão de UMA árvore (signal de Set + aoEvento/expandirTudo/
                                             colapsarTudo). Instanciado 2× pelo Smart — sem par de métodos …1/…2.

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
    importador-csv.component/     DUMB genérico <T>. MOTOR de importação por planilha: upload → parse → preview →
                                    confirmar → 422 por linha (traduz índice do lote p/ índice da planilha).
                                    Estratégias por @Input função: parse/importar/rotuloLinha (padrão do
                                    autocomplete). Não injeta Facade. i18n próprio em IMPORTADOR_CSV.*.
    importar-alunos.component/    Adaptador de aluno sobre o motor: fixa T=AlunoAdicionarDTO e liga as estratégias.
                                    ⚠️ Injeta AlunoFacadeService morando em shared/ — viola a regra de fronteira
                                    abaixo; ver dívida D10.
    arvore/                       DUMB genérico <T> SEM restrição: arvore.component (container, só o @for de topo)
                                    + no-arvore.component (RECURSIVO via forwardRef, desenha por status).
                                    Não injeta Facade, não faz HTTP: recebe [nos]/[expandidos], emite um único
                                    (evento) com união discriminada EventoArvore<T>. Sem ARIA e sem teclado por
                                    decisão de escopo — a vitrine existe p/ o fluxo base (ver docs da feature).
  interfaces/                     Contratos de dados, agrupados por papel (ver SKILL-data-modeling-contracts.md):
    dto/                          Contratos de ESCRITA (payload p/ servidor): aluno-adicionar/editar, login.
    entities/                     Domínio (contrato de leitura): entidade-base, aluno, docente-sql, usuario-autenticado.
    ui/                           Genéricos de tela: tabela-coluna, acao/evento-tabela, select-option/filter,
                                    filtro-lista, aluno-filtro, resultado-paginado, alerta-state.
  models/                         EntidadeBaseModel, AlunoModel — classes concretas, NÃO instanciadas em runtime (dívida D6).
  enums/        sexo.enum.ts      SexoEnum numérico (MASCULINO=1, FEMININO=2, OUTRO=3).
  pipes/        cpf-cnpj · sexo-format · error-message  (pipes retornam CHAVE i18n, não texto traduzido).
  validators/   cpf-cnpj.validator.ts (Módulo 11) · idade.validator.ts.
  utils/        cpf-cnpj.utils.ts (formatarCpfCnpj) · montar-arvore-turmas.util.ts (lista plana → árvore
                  ano/série/turma/aluno, um construtor por nível, p/ a 2ª árvore da vitrine /tree-view) ·
                  traduzir-filhos.util.ts (índice → EstadoFilhos<T>: dono único da regra ocioso/carregando/erro/
                  pronto, usado pelas DUAS árvores) · entidade-arvore.util.ts (eTurma/eDocente/eAluno por `in`).
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
- ~~**D8 — Níveis 2 e 3 da árvore eram aproximação client-side.**~~ **Resolvida em 2026-08-06:** o back subiu `GET /turmas/{id}/docentes` e `GET /turmas/{id}/alunos`, e o Facade passou a consumi-los. O critério de aceite se confirmou — mudou só o ponto de busca (+ dois métodos HTTP em `TurmaService`); Smart, Dumb e contratos ficaram intactos. Topologia final (2026-08-12): a árvore 1 é `Turma › Docente(folha)` e a árvore 2 é `Ano › Série › Turma › Aluno(folha)` — aluno pendura na **turma**, nunca sob docente, então nenhuma camada parseia chave para achar ancestral.
- **D10 — `ImportarAlunosComponent` injeta Facade morando em `shared/`.** Contraria a regra de fronteira desta seção: quem injeta Facade e conhece o domínio deveria estar em `features/<dominio>/`. É o **único** componente de `shared/` acoplado a um facade de domínio (o `nav-bar` usa `AuthFacadeService`, que é transversal). Registrada em 2026-08-17, depois do refactor do importador genérico: ele **reduziu** o problema de ~93 para ~37 linhas e tirou toda a mecânica reutilizável para o `ImportadorCsvComponent` (Dumb, corretamente em `shared/`), mas não o resolveu. ⚠️ Alvo não é óbvio: o componente é consumido por **duas** features (`AlunoIndex` e o wizard de turmas), então mover para `features/aluno/` troca a violação de fronteira por um import feature→feature. Decidir qual das duas é o menor custo antes de mexer.
- **D9 — A vitrine `/tree-view` não tem ARIA, teclado nem spec.** Decisão de escopo consciente (2026-08-12), não esquecimento: o objetivo do componente é o **fluxo base** de uma árvore (recursão + lazy + índice-cache), então `role`/`aria-*`/roving tabindex e a suíte de testes ficaram fora. Consequências assumidas: a árvore é operável só com mouse e o Facade — dedupe, paralelismo e erro isolado por galho — é verificado à mão. Se a feature sair de vitrine, os dois itens voltam a valer; o desenho do teclado está guardado no apêndice de [COMPONENTE-TREE-VIEW-REFERENCIA.md](docs/roteiro-implementacao/COMPONENTE-TREE-VIEW-REFERENCIA.md).

## 5. Scripts

`npm start` (ng serve) · `npm run build` · `npm run watch` · `npm test` (Vitest).

## 6. Onde ler as regras

`AGENTS.md` (global — sempre carregado: princípios, três camadas, reflexos-gatilho, ordem de prioridade) · Skills em `.claude/skills/`: `component-design` · `state-and-data-flow` · `rxjs-reactive-patterns` · `data-modeling-contracts`.
