---
name: gestao-turmas-front-agents
description: Regras globais de desenvolvimento do front-end Gestão de Turmas. Stack Angular 21 zoneless + RxJS 7.8 + Vitest. Define princípios não-negociáveis e roteia o detalhe para os arquivos de SKILL. Leia este arquivo primeiro; ele NÃO repete o conteúdo dos SKILLs.
---

# Regras Globais — gestao-turmas-front

Stack: Angular 21 (standalone, sem NgModule), **zoneless** (`zone.js` não está instalado), TypeScript estrito, RxJS 7.8, SCSS, ngx-translate 17, Vitest.

## Princípios não-negociáveis

1. **Feche portas para bugs.** Construa de forma que o compilador e a arquitetura impeçam o erro, em vez de confiar na disciplina de quem escreve. Antes de "como faço isso?", pergunte "como faço de um jeito impossível de usar errado?".
2. **Dono único da informação.** Toda informação tem um único dono. Se você precisa lembrar de atualizar X junto com Y, eles têm o mesmo dono e devem ser uma estrutura só.
3. **Smart vs. Dumb decidido antes de codar.** Pergunta única: o componente sabe de onde vêm os dados e para onde vão os eventos? Se sim, é Smart. Veja a Skill `component-design`.
4. **Contrato antes do interior.** Defina `@Input()`/`@Output()` (a API pública) antes da implementação. O interior é trocável; o contrato não.
5. **`unknown`, nunca `any` por preguiça.** `any` desliga o compilador. Use `unknown` + narrowing, ou genéricos de verdade. Onde `any` ainda existe no código, é dívida (veja `CONTEXT.md`).

## Convenções de código

- **Injeção:** use `inject()` em campo `private readonly`, não por construtor (resumo; detalhe na Skill `rxjs-reactive-patterns`). Para inicialização eager, o lugar é `provideAppInitializer()` no `app.config.ts` — é onde a restauração de sessão e a limpeza de storage já moram. ⚠️ O construtor de `app.ts` ainda configura idioma do i18n, mas `provideTranslateService` no `app.config.ts` já define `lang` e `fallbackLang`: são dois donos da mesma informação, e é dívida, não exemplo a seguir.
- **Decorators vs. signals (ressalva fixa do projeto):** o contrato de I/O usa `@Input()`/`@Output()` decorators clássicos por exigência externa — não migre para `input()`/`output()`. ⚠️ Restrição registrada em junho/2026 e contrária à direção do framework; confirme que a exigência continua valendo antes de propagá-la para código ou documento novo. Já `signal()`/`computed()` não são concessão: num app zoneless eles são o mecanismo de detecção de mudança. Use-os à vontade para **estado interno** de componente. Detalhe na Skill `component-design`.
- **Zoneless tem duas consequências práticas:** a detecção de mudança não roda por efeito colateral de `setTimeout`/`Promise` — derive de signal ou de `async pipe`; e em teste **`fakeAsync`/`tick` estouram**, use `vi.useFakeTimers()` + `advanceTimersByTime()` para dirigir `debounceTime`.
- **Standalone sempre.** Componentes, pipes e diretivas declaram `imports: [...]`; nunca crie NgModule. Não escreva `standalone: true` — é o default desde o Angular 19, e o código está dividido entre quem escreve e quem omite.
- **Extensão `.js` nos imports — dois padrões distintos, não um só.** Import **dinâmico** de rota (`import('./x.component.js')` em `*.routes.ts`) leva `.js`: são 13 de 13 ocorrências. Import **estático** (`from './x'`) **não** leva: 243 sem contra 28 com, e essas 28 estão concentradas em `app.ts` e `aluno-index.component.ts` como resíduo. Ao criar import estático novo, escreva sem extensão.
- **Strings de UI sempre via i18n.** Nunca hardcode texto visível. Detalhe e exceções na Skill `data-modeling-contracts`.

## Nomenclatura

- Arquivos em `kebab-case` com sufixo de papel: `*.component.ts`, `*.service.ts`, `*.facade.service.ts`, `*.guard.ts`, `*.interceptor.ts`, `*.pipe.ts`, `*.validator.ts`, `*.interface.ts`, `*.enum.ts`, `*.type.ts`, `*.model.ts`, `*.util.ts`, `*.routes.ts`.
- ⚠️ Utilitário é **`.util.ts` no singular** (11 arquivos); `cpf-cnpj.utils.ts` é a única exceção e é resíduo. Os caches (`cache-memoria.ts`, `cache-storage.ts`) não têm sufixo — também resíduo, não licença para omitir.
- Classes e enums em `PascalCase`; variáveis e métodos em `camelCase` (em português, alinhado ao domínio).
- Interfaces SEM prefixo `I`, COM sufixo `Interface` (`AlunoInterface`). Exceções históricas: DTOs (`AlunoAdicionarDTO`), states (`AlertaState`), enums (`SexoEnum`).

## Acessibilidade

- Siga WCAG AA para foco, contraste e ARIA em componente novo. ⚠️ Gate parcial desde 2026-08-31: as regras de template do `angular-eslint` (`templateAccessibility`) checam ARIA, foco e evento de teclado nos `.html`. O **contraste** é checado pelo SonarQube (`css:S7924`), não pelo ESLint. **Continua sem axe e sem pa11y** — navegação real por teclado e leitor de tela seguem sem verificação. Primeira rodada: 13 achados no ESLint e 21 no Sonar, ainda abertos. Exceções conscientes existem e estão registradas (a vitrine `/tree-view` não tem ARIA nem teclado — dívida D9 no `CONTEXT.md`).
- Prefira elementos nativos semânticos (ex.: `<dialog>` no Modal) a recriar comportamento com `<div>`.

## Log e diagnóstico

- **Nenhum `console.*` recebe objeto de domínio.** Nunca `console.log(aluno)`, `console.error(docente)` nem o `FormGroup` de um cadastro: eles carregam CPF, e-mail e data de nascimento. Logue **identificador e ação** (`aluno.id`, `evento.acaoId`), nunca a ficha.
- **`HttpErrorResponse` de rota de domínio não vai inteiro para o console.** O objeto embute `error` (o corpo da resposta) e `url`. De `/alunos`, isso é a ficha completa impressa no DevTools. Logue `erro.status` e `erro.url`, ou trate em silêncio e mostre `AlertaState` na tela.
- **Erro de terceiro sem dado pessoal pode ir inteiro** — é o caso do log de feriados, que fala com a BrasilAPI.
- **Antes de plugar telemetria externa** (Sentry, Application Insights ou similar), revise o que o payload leva: `provideBrowserGlobalErrorListeners()` hoje só escreve no console, e passar a enviar para fora é tratamento de dado com outro operador.

> ⚠️ A barreira mecânica desta regra é a **R3 do `verify-conformidade.mjs`**, não o ESLint: nenhuma regra de prateleira sabe o que é objeto de domínio aqui. Contexto e inventário dos `console` existentes em [docs/roteiro-implementacao/HIGIENE-DEFENSIVA.md](docs/roteiro-implementacao/HIGIENE-DEFENSIVA.md) §2.

## Análise estática (ESLint + SonarQube)

Quatro camadas com donos distintos. Não confunda qual delas reprova o quê:

| Camada                 | Ferramenta                                     | Onde reprova                             |
| ---------------------- | ---------------------------------------------- | ---------------------------------------- |
| Formatação             | Prettier (`verify:format`)                     | `npm run verify` + CI                    |
| Regras deste projeto   | `verify-conformidade.mjs` (R1–R4, AST própria) | `npm run verify` + CI                    |
| Regras de ecossistema  | ESLint (`npm run lint`)                        | `npm run verify` + CI                    |
| Tendência e duplicação | SonarQube Cloud                                | servidor; Quality Gate sobre código novo |

- ⚠️ **`it.only` não tem captura determinística.** Não há plugin de Vitest no ESLint: um `.only` só é pego de rebote, quando pula testes suficientes para derrubar a cobertura abaixo do threshold. Em spec pequeno, passa.
- **ESLint não substitui o `verify-conformidade.mjs`.** As regras R1–R4 conhecem as três camadas deste projeto; nenhuma regra de prateleira conhece. Os dois convivem, e a allowlist continua sendo a de lá.
- **Todo apontamento cai em um de três baldes, e escolher o balde é a tarefa:** (a) corrigir o código; (b) configurar a regra, quando o apontamento é que está errado; (c) aceitar e registrar o motivo. Apontamento não é tarefa automática — `coluna.chaveOrdenacao == null` no `tabela-generica` usa `==` de propósito, para pegar `null` e `undefined`; "corrigir" para `===` introduziria um bug.
- **Regra desligada tem dono único.** Com o Connected Mode ativo, o `sonarlint.rules` local é ignorado: desligar regra do Sonar é no Quality Profile do servidor; desligar regra do ESLint é no `eslint.config.js`. Quando a regra tem gêmea nos dois (ex.: clique sem equivalente de teclado), a decisão precisa ser tomada nos dois lugares.

### Exceções aceitas no ESLint

Toda exceção escopada em `eslint.config.js` está listada aqui com o motivo. **A lista só pode encolher** — mesma regra do `conformidade-allowlist.json`. Exceção sem motivo nesta lista não entra.

- **`no-inferrable-types` e `no-empty-function`, em `**/\*.component.ts`** — custo estrutural de `ControlValueAccessor` (`onChange = () => {}`) e de tipo explícito em `@Input`. Escopo limitado a componente **de propósito**: o mesmo achado num model é correção real, e foi corrigido como tal.
- **`no-explicit-any`, em `tabela-coluna.interface.ts` e `acao-tabela.interface.ts`** — dívida **D2** tornada explícita. Tipar de verdade exige `TabelaColuna<T, K extends keyof T>` com o valor amarrado a `T[K]`, porque cada coluna formata um campo de tipo diferente da mesma linha; o ripple são 6 arquivos e 16 callbacks. É fatia própria, não item de faxina.
- **`click-events-have-key-events` e `interactive-supports-focus`, em três templates** — nos três o apontamento é de escopo da regra, que avalia elemento por elemento:
  - `no-arvore.component.html` — dívida **D9**: a vitrine `/tree-view` sem ARIA nem teclado é decisão consciente de 2026-08-12.
  - `autocomplete.component.html` — o teclado existe, no `@HostListener` do host (`arrowdown`, `arrowup`, `enter`, `escape`). No padrão ARIA de combobox a interação mora no input, não em cada `<option>`.
  - `file-upload.component.html` — o teclado existe no `<input type="file">`, que é focável desde que `hidden` virou classe visualmente oculta. A regra não enxerga o caminho no elemento vizinho.

### Achados aceitos no SonarQube

O servidor tem **0 issues abertas** desde 2026-09-02: 7 marcadas como _False Positive_ (a regra está errada sobre o código) e 17 como _Accept_ (a regra está certa e a decisão foi não corrigir). A distinção entre as duas resoluções é deliberada — trocar uma pela outra apaga a diferença entre erro de ferramenta e dívida assumida.

- ⚠️ **`javascript:S7718` reincide.** Ela exige `catch (error_)` e colide com a nomenclatura em português. Desligá-la exigiria copiar o perfil built-in `Sonar way`, que é somente leitura, e trocar o perfil do projeto — 5 passos para uma ocorrência. Ficou como _Accept_, então **volta a acusar a cada `catch (erro)` novo em arquivo `.mjs`**. Vale criar perfil próprio quando houver a segunda regra a desligar.
- ⚠️ **`turma-card` tem 2 achados aceitos que apontam um problema real.** O `role="button"` no `<article>` faz o nome acessível do controle ser todo o conteúdo do card, e tira o `<h3>` da navegação por cabeçalhos. O teclado funciona; o anúncio é ruim. A correção é o padrão de botão interno com `::after` esticado, e está reservada para fatia própria.

> ⚠️ **Custo assumido:** exceção por arquivo silencia também violação **nova** no mesmo arquivo. Foi escolha consciente sobre `eslint-disable` inline, que seria preciso por linha mas exigiria comentário justificando dentro do código. Ao mexer nesses arquivos, confira o caso à mão.

### Servidor SonarQube

- Projeto `samueldebarros_gestao-de-turmas-front`, organization `samueldebarros`, região EU (`https://sonarcloud.io`).
- **Decisão de 2026-08-31: sem Docker neste ambiente.** O MCP do SonarQube só é distribuído como contêiner, então ele não existe aqui — não tente chamar ferramenta `sonarqube`/`mcp__sonarqube__*`. O acesso programático é pela **API REST**, com token em `.env.sonar` (coberto pelo `.gitignore`).
- **Hotspot de segurança não vem em `/api/issues/search`** — é endpoint separado (`/api/hotspots/search`). Quem lê só issues conclui "limpo" cedo demais. Métricas e duplicação ficam em `/api/measures/component`.
- Autenticação exige **USER token**. `Not authorized` costuma ser token de projeto, não de usuário.
- **Depois de corrigir, não confirme pelo servidor**: ele só reflete a próxima análise. Confirme com `npm run lint` e `npm run verify`.
- O feedback no editor vem do **Connected Mode** da extensão SonarQube for IDE, com `focusOnNewCode` ligado. Ele analisa **só os arquivos abertos** — Problems panel vazio não é prova de projeto limpo.

## As três camadas (regra em uma frase)

> **Component (Smart)** decide e exibe → **Facade** detém o estado e orquestra → **Service** fala HTTP e nada mais.

- O Service nunca tem estado nem `subscribe`; retorna `Observable` frio tipado.
- O Facade detém o estado (ex.: filtro/página num `BehaviorSubject`), expõe leitura como `Observable` e expõe mutação como método de intenção.
- O Component Smart injeta o Facade, liga a leitura no `async pipe` e chama os métodos de intenção. Componentes Dumb não conhecem Facade nem domínio.
- **Transversais, fora das três camadas:** `core/interceptors/` age entre Service e rede (`credentials` só marca `withCredentials` quando a URL começa com `environment.apiUrl`, para não vazar cookie a terceiro como a BrasilAPI; `auth-error` trata 401 e 403) e `core/guards/` age antes da rota ativar (`autenticado`, `papel`). Regra de fronteira: **interceptor e guard não conhecem domínio** — nada de Aluno ou Docente ali dentro. Nenhuma Skill cobre esses dois; leia o código antes de alterá-los.

## Reflexos-gatilho (pare e repense ENQUANTO digita)

Aplicam-se a qualquer camada. Quando um disparar, a Skill relevante tem a saída.

1. Escreveu `any`? → genérico de verdade (`unknown` + narrowing) ou preguiça de tipar? A questão nunca é o `any`, é **quem valida**.
2. `.value` dentro de um pipe RxJS? → reatividade falsa; derive do stream, não leia snapshot.
3. Setou 2+ propriedades sempre juntas? → é um objeto disfarçado; modele como um.
4. Vai chamar `obj.subject$.next()` de fora da classe dona? → exponha um método de intenção (Tell, Don't Ask).
5. Feature nova exige mexer em 3+ arquivos? → acoplamento; considere parameter object.
6. Escreveu `!` ou `as X`? → promessa não validada em runtime; "se for falsa, onde isto explode?".
7. Digitou `console.` com uma variável que não é primitiva? → é objeto de domínio? Logue o `id` e a ação, não a ficha. Ver "Log e diagnóstico".

## Ordem de prioridade quando em dúvida

1. **Correção estrutural** — fonte única da verdade, encapsulamento, race condition. Bug que o usuário vê.
2. **Contrato e tipos** — `unknown` vs `any`, boundary tipado, parameter object. Define o que o compilador protege.
3. **Disciplina interna** — OnPush, signals, coesão, DRY. Manutenibilidade, não trava produção.

## Roteamento de Skills (onde está o detalhe)

O detalhe operacional vive em **Skills** (`.claude/skills/<nome>/SKILL.md`). Invoque a Skill correspondente ANTES de codar a parte relevante — não confie só nesta tabela.

| Quando você for...                                                          | Invoque a Skill                 |
| --------------------------------------------------------------------------- | ------------------------------- |
| Decidir Smart/Dumb, criar componente, implementar CVA, two-way binding      | `component-design`              |
| Mexer em estado, Facade, paginação, filtro reativo, fluxo de dados          | `state-and-data-flow`           |
| Escrever stream RxJS, chamada HTTP, decidir async pipe vs. subscribe        | `rxjs-reactive-patterns`        |
| Modelar interface, DTO, enum, formulário tipado, validador, i18n            | `data-modeling-contracts`       |
| Escrever um guia técnico ou um roteiro de etapas em `docs/`                 | `implementation-docs`           |
| Escrever doc que ENSINA o fluxo de construção, com tropeços e idas e vindas | `doc-implementacao-incremental` |
| Entender a estrutura do repo, o que existe e as dívidas técnicas            | leia `CONTEXT.md`               |
