---
name: gestao-turmas-front-context
description: Mapa fiel da codebase do front-end Gestão de Turmas — estrutura real de pastas, módulos de domínio existentes, padrões adotados e dívidas técnicas conhecidas. Verificado contra o código em agosto/2026. Para regras, ver AGENTS.md e os SKILLs.
---

# Contexto da Codebase — Gestão de Turmas Front-end

App Angular 21 (standalone, zoneless) para administração de turmas. Consome uma API .NET cuja URL vem de `environment.apiUrl` — `https://localhost:7048/api` em desenvolvimento, e a API publicada no Azure em produção. Autenticação por cookie HttpOnly, com guard de sessão e de papel em toda rota de domínio.

Telas existentes: **Aluno** (CRUD completo, paginado, filtrável, com importação por planilha), **Docente** (listagem read-only), **Turma** (cards + wizard de cadastro em 3 passos), **Dashboard** (dois relatórios read-only), **tree-view** (vitrine de árvore), além de login e sem-permissão. Disciplina não tem tela nem endpoint REST.

## 1. Stack

Angular 21 **zoneless** (sem `zone.js` instalado) · TypeScript estrito (`strict`, `strictTemplates`, `noPropertyAccessFromIndexSignature`) · RxJS 7.8 · SCSS · `@ngx-translate/core` 17 (loader HTTP) · Vitest 4 (12 arquivos de spec, 167 testes, cobertura global ~23% statements / ~40% branches — verificado 2026-08-26).

## 2. Estrutura real de `src/app/`

```
app.ts / app.html / app.scss      Root standalone. Inicializa i18n no constructor; usa signal() p/ title.
app.config.ts                     provideRouter + provideHttpClient (withFetch + 2 interceptors) +
                                    provideBrowserGlobalErrorListeners + 2 provideAppInitializer (limpeza de
                                    storage e restaurarSessao) + provideTranslateService (loader HTTP, pt-BR).
app.routes.ts                     Lazy loading REAL, 5 domínios via loadChildren + login e sem-permissao via
                                    loadComponent. TODA rota de domínio passa por canMatch: [autenticadoGuard,
                                    papelGuard(...)]. '' → 'login'; '**' → ''.

core/
  services/    aluno.service.ts        HTTP puro do domínio Aluno (CRUD + inativar/reativar + importar).
                                         ⚠️ A busca é POST /alunos/buscar com o filtro no CORPO, não GET com
                                         query string: o termo aceita CPF e não pode vazar para log/histórico.
               docente.service.ts      HTTP puro do domínio Docente (lista sem paginação).
               turma.service.ts        CRUD de Turma + GET /turmas/{id}/docentes e /alunos (níveis da árvore).
               auth.service.ts         login/logout/refresh/me. Cookie HttpOnly — não manipula token.
               dashboard.service.ts    Dois relatórios read-only do painel.
               feriado.service.ts      BrasilAPI via HttpBackend — pula os interceptors de propósito.
               localidade.service.ts   IBGE, para a árvore de localidades.
  guards/      autenticado.guard.ts    canMatch de sessão.
               papel.guard.ts          Fábrica papelGuard(...papéis) → 403 manda p/ /sem-permissao.
  interceptors/ credentials.interceptor.ts  Só marca withCredentials quando a URL começa com environment.apiUrl.
               auth-error.interceptor.ts   401 → refresh → retry → /login; 403 → /sem-permissao.
  facades/     aluno-facade.service.ts BehaviorSubject de estado de filtro/página + resultado$ derivado (switchMap). Métodos de intenção.
               docente-facade.service.ts  Wrapper read-only com shareReplay({bufferSize:1, refCount:true}).
               auth-facade.service.ts     Sessão + renovarSessao() single-flight.
               turma-facade.service.ts · dashboard-facade.service.ts · feriado-facade.service.ts ·
               localidade-facade.service.ts
               arvore-facade.service.ts   Índice chave→EstadoBuscaFilhos (BehaviorSubject) que É o cache do lazy.
                                            Duas intenções (carregarDocentesDaTurma/carregarAlunosDaTurma) caem em
                                            pedir(): guarda "já busquei?" + Subject + mergeMap (nunca switchMap:
                                            galhos diferentes), catchError DENTRO do achatador. O pedido leva o
                                            buscador como thunk — o Facade não despacha por tipo de entidade.

features/                         Componentes SMART de domínio, um diretório por feature. Cada um traz seu *.routes.ts (lazy).
  aluno/        aluno-index.component.ts   SMART. Lista paginada + modal CRUD + filtros + alertas. + aluno.routes.ts.
  docente/      docente-index.component.ts SMART minimalista (só docentes$ | async). + docente.routes.ts.
  turma/        turma-index.component.ts   SMART. Cards de turma. + turma-cadastro.component/ (wizard de 3 passos
                                             sobre o app-stepper genérico, em rota dedicada).
  dashboard/    dashboard-index.component.ts SMART read-only. Dois relatórios via TabelaGenerica.
  login/        login.component.ts         SMART. Form de login + alerta.
  sem-permissao.component/                 Página de 403. Sem Facade, sem domínio.
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
    date-picker.component/        DUMB + CVA. Calendário próprio em signals; contrato yyyy-MM-dd drop-in.
                                    Marca feriado via BrasilAPI (falha silenciosa).
    autocomplete.component/       DUMB genérico. switchMap + debounce DENTRO do componente; busca stateless no Facade.
    file-upload.component/        DUMB + CVA File|null. Drag-drop + validação de tipo/tamanho.
    stepper.component/ + passos/  DUMB genérico de wizard, usado pelo cadastro de turma.
    turma-card.component/         DUMB de card de turma.
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
  enums/        sexo.enum.ts (MASCULINO=1, FEMININO=2, OUTRO=3) · direcao-ordenacao.enum.ts (Asc=1, Desc=2) ·
                  ordenacao-aluno.enum.ts · turno.enum.ts. Todos numéricos.
  types/        papel-usuario.type.ts   União de papéis, usada pelo papelGuard.
  pipes/        cpf-cnpj · cpf-cnpj-mascarado · sexo-format · error-message  (pipes retornam CHAVE i18n,
                  não texto traduzido).
  validators/   cpf-cnpj.validator.ts (Módulo 11) · idade.validator.ts · texto.validator.ts. Os três com spec.
  utils/        cpf-cnpj.utils.ts (formatarCpfCnpj) · montar-arvore-localidades.util.ts (lista plana do IBGE →
                  árvore, p/ a 2ª árvore da vitrine /tree-view) · traduzir-filhos.util.ts (índice →
                  EstadoFilhos<T>: dono único da regra ocioso/carregando/erro/pronto, usado pelas DUAS árvores) ·
                  entidade-arvore.util.ts (eTurma/eDocente por `in`) · chaves-arvore.util.ts · folhas-de.util.ts ·
                  agrupar-por-disciplina.util.ts · parsear-csv-alunos.util.ts (com spec) ·
                  ler-arquivo-texto.util.ts · limpar-namespace-storage.util.ts · cache-memoria.ts ·
                  cache-storage.ts (⚠️ os dois caches sem sufixo de papel — resíduo).
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

- ~~**D1 — OnPush ausente.**~~ **Resolvida (verificado 2026-08-25):** há 28 ocorrências de `ChangeDetectionStrategy` no código; `AlunoIndex`, `DashboardIndex`, `TreeViewIndex`, `TurmaIndex` e `TurmaCadastro` usam OnPush. A ressalva sobre o `AlunoIndex` caiu junto — ele está com OnPush apesar do `subscribe()`/`tap()`. Mantenha o padrão em componente novo.
- **D2 — `any` residual.** `TabelaColuna.formatador/cssClassCelula` e `AcaoTabela.condicaoVisibilidade` usam `(valor: any)`; os callbacks CVA (`onChange`/`onTouched`) também. Alvo: genéricos (`<T>`) e tipos de função.
- ~~**D3 — Estado modal não-discriminado.**~~ **Resolvida (verificado 2026-08-25):** existe `EstadoModal` como união de três casos (`fechado` | `adicionar` | `editar` com o aluno junto) em `shared/interfaces/ui/estado-modal.interface.ts`, consumida no `AlunoIndex` via `signal<EstadoModal>`. Os campos soltos e o `!` sumiram.
- ~~**D4 — i18n incompleto no Docente.**~~ **Resolvida na Fatia A (2026-08-26):** o `docente-index` ganhou `TABELA.COLUNAS.DOCENTE.*` e o namespace `DOCENTE.*` próprios, nos dois idiomas; não resta string crua nem chave emprestada de Aluno. ⚠️ **Agora tem guarda dupla:** a regra `R4` do harness de conformidade está com teto **0** (violação nova reprova `npm run verify`), e a spec do componente asservere que todo título de coluna casa o formato de chave i18n. A guarda do gate vale para o repositório inteiro; a do teste, só para este componente — de propósito, para sobreviver a alguém afrouxar a allowlist.
- **D5 — `[control]` como Input coexiste com CVA.** Os form-fields implementam CVA, mas ainda recebem `@Input() control?` para exibir erro. É um híbrido consciente; o caminho-alvo é o componente derivar o estado de erro do próprio CVA/`NgControl`.
- **D6 — Models concretos sem uso em runtime.** `AlunoModel`/`EntidadeBaseModel` existem mas o domínio flui inteiramente por interfaces e DTOs; nada instancia essas classes. Mantê-las apenas se surgir necessidade real (factory/defaults); caso contrário são candidatas a remoção.
- ~~**D7 — `apiUrl` hardcoded** no service.~~ **Resolvida (verificado 2026-08-25):** os 7 services montam a URL a partir de `environment.apiUrl` (o de feriados usa `environment.brasilApiUrl`). ⚠️ A Skill `rxjs-reactive-patterns` ainda afirma que está hardcoded — corrigir lá também.
- ~~**D8 — Níveis 2 e 3 da árvore eram aproximação client-side.**~~ **Resolvida em 2026-08-06:** o back subiu `GET /turmas/{id}/docentes` e `GET /turmas/{id}/alunos`, e o Facade passou a consumi-los. O critério de aceite se confirmou — mudou só o ponto de busca (+ dois métodos HTTP em `TurmaService`); Smart, Dumb e contratos ficaram intactos. Topologia atual (verificada 2026-08-25): a árvore 1 é `Turma › Docente(folha)`, servida pelo `ArvoreFacadeService`; a árvore 2 **não é mais** `Ano › Série › Turma › Aluno` — virou a árvore de **localidades do IBGE**, servida pelo `LocalidadeFacadeService` + `montarArvoreLocalidades`. Não existe mais util de árvore de turmas, e nenhum arquivo do `src/` menciona "série".
- **D10 — `ImportarAlunosComponent` injeta Facade morando em `shared/`.** Contraria a regra de fronteira desta seção: quem injeta Facade e conhece o domínio deveria estar em `features/<dominio>/`. É o **único** componente de `shared/` acoplado a um facade de domínio (o `nav-bar` usa `AuthFacadeService`, que é transversal). Registrada em 2026-08-17, depois do refactor do importador genérico: ele **reduziu** o problema de ~93 para ~37 linhas e tirou toda a mecânica reutilizável para o `ImportadorCsvComponent` (Dumb, corretamente em `shared/`), mas não o resolveu. ⚠️ Alvo não é óbvio: o componente é consumido por **duas** features (`AlunoIndex` e o wizard de turmas), então mover para `features/aluno/` troca a violação de fronteira por um import feature→feature. Decidir qual das duas é o menor custo antes de mexer.
- **D9 — A vitrine `/tree-view` não tem ARIA, teclado nem spec.** Decisão de escopo consciente (2026-08-12), não esquecimento: o objetivo do componente é o **fluxo base** de uma árvore (recursão + lazy + índice-cache), então `role`/`aria-*`/roving tabindex e a suíte de testes ficaram fora. Consequências assumidas: a árvore é operável só com mouse e o Facade — dedupe, paralelismo e erro isolado por galho — é verificado à mão. Se a feature sair de vitrine, os dois itens voltam a valer; o desenho do teclado está guardado no apêndice de [COMPONENTE-TREE-VIEW-REFERENCIA.md](docs/roteiro-implementacao/COMPONENTE-TREE-VIEW-REFERENCIA.md).

## 5. Scripts

`npm start` (ng serve) · `npm run build` · `npm run watch` · `npm test` (Vitest) · `npm run test:watch` · `npm run test:cov` (com cobertura).

**Existe comando único de verificação desde 2026-08-26** (o harness da parte do PDI "Desenvolvimento Orientado a IA"; ver [docs/desenvolvimento-com-ia/](docs/desenvolvimento-com-ia/)):

- `npm run verify` — encadeia, do mais barato ao mais caro e parando no primeiro vermelho: `verify:format` (prettier **só no diff** contra `main`) → `verify:conformidade` (AST do TypeScript conferindo 4 regras do `AGENTS.md`, com allowlist por arquivo em `scripts/conformidade-allowlist.json`) → `verify:test` (suíte com **catraca** de cobertura em `angular.json`) → `verify:build` (build + grep anti-vazamento de `localhost`).
- `npm run verify:escopo` — fica **fora** da cadeia e cobra 80% de cobertura no recorte da fatia em construção, pela `configuration` `escopo` do alvo `test`.
- Threshold global **é catraca, não meta**: cravado no baseline para impedir regressão. Quando a cobertura sobe, o piso sobe atrás.
- ⚠️ Continua **sem ESLint** e sem ferramenta de a11y.

CI: `.github/workflows/verify.yml` roda `npm run verify` em PR e em push de branch; `deploy.yml` chama o mesmo comando em vez de repetir os passos, para o gate ter dono único. Os dois usam `fetch-depth: 0` — sem isso a ref base não resolve e `verify:format` sai com código 2 (gate quebrado), que é diferente de reprovação.

## 6. Onde ler as regras

`AGENTS.md` (global — sempre carregado: princípios, três camadas, reflexos-gatilho, ordem de prioridade) · Skills em `.claude/skills/`, **oito** no total: quatro de código — `component-design` · `state-and-data-flow` · `rxjs-reactive-patterns` · `data-modeling-contracts` — duas de formato de documento — `implementation-docs` · `doc-implementacao-incremental` — e duas criadas em 2026-08-26 na parte do PDI de desenvolvimento com IA: `feature-slice` (dona da **ordem** de uma fatia vertical e da decisão de cada transição entre camadas) e `testing-zoneless` (como se testa aqui, incluindo a restrição de não haver `zone.js`).

⚠️ `.claude/` está no `.gitignore`: as Skills não são versionadas e não sobrevivem a um clone limpo. As duas mais novas têm **cópia versionada** em [docs/desenvolvimento-com-ia/skills/](docs/desenvolvimento-com-ia/skills/) — as outras seis, não.
