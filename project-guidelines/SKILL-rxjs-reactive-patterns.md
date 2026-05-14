# Skill: Padrões Reativos e Integração Front-end (RxJS)

## Streams e Observables

- Retorne `Observable<T>` diretamente de services, nunca tipos genéricos.
- Use `Subject<void>` para gatilhos de refresh (ex: `private readonly refresh$ = new Subject<void>()`).
- Inicialize streams com `startWith(void 0)` para executar imediatamente sem trigger.
- Encadeie com `switchMap()` para trocar de observable (cancela anterior).
- Use `map()` para transformar dados antes de render.
- Mapeie enums/DTOs para tipos amigáveis no stream (ex: `sexoDescricao` agregado).

## Tratamento de Erros

- Use `catchError()` para capturar erros, retorne `of(null)` ou similar.
- Defina estado de alerta: `tipoAlerta: 'sucesso' | 'erro'` + `textoAlerta: string`.
- Sempre use chaves i18n para mensagens de erro (ex: `'MENSAGEM.ERRO_CADASTRO_ALUNO'`).
- Não lance exceções não tratadas; retorne observable nulo e ative UI de erro.

## Binding em Template

- Use `async pipe` para render de observables (ex: `listaAlunos$ | async`).
- Nunca use `.subscribe()` em componentes para exibição; a injeção de dependência resolve isso.
- Valide observable com `@if (stream$ | async as variavel)` para type-safety.

## Integração HTTP

- Injete `HttpClient` em services com `private readonly http: HttpClient`.
- Tipifique o retorno: `this.http.get<TipoEsperado[]>(url)`.
- Nunca altere URLs inline; defina como `private readonly apiUrl`.
- POST/PUT: use DTOs de envio (ex: `AlunoCreateDTO`), não classes completas.

## Services e Dependency Injection

- Todos services singleton: use `providedIn: 'root'`.
- Injete dependências com `private readonly nomeService: NomeService`.
- Método construtor é o lugar ÚNICO para injeções, nunca em ngOnInit.
- Não mantenha estado mutável em services; use observables ou sinais.

## Side Effects e Operadores

- Use `tap()` para side effects (fechar modal, recarregar lista, etc).
- Coloque `tap()` sempre antes de `subscribe()` para garantir ordem.
- `tap()` é permitido apenas para ações UI (não para transformação de dados).
- Encadeie: `pipe(tap(...), catchError(...), tap(...)).subscribe()`.

## Composição de Streams

- Prefira `switchMap()` sobre `mergeMap()` para evitar race conditions.
- Use `Subject.next(valor)` para disparar novos dados no stream.
- Para múltiplos streams independentes, use um `observable.pipe(...) | async` por observable.

## Anti-patterns

- ❌ Nunca use `.subscribe()` em componentes para lógica de render; use async pipe.
- ❌ Não desestruture o retorno de `pipe()`; prefira `as` no template.
- ❌ Nunca crie observables sem tipagem (ex: `Observable<any>`).
- ❌ Não ignore chamadas HTTP com `subscribe()` sem tratar erro.
- ❌ Nunca mantenha subscriptions ativas sem unsubscribe (use async pipe ou takeUntil).
