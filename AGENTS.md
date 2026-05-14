# 🤖 Agent System Instructions (Gestão de Turmas - Front-end)

## Papel

- Use TypeScript e Angular para código claro, tipado e acessível
- Prefira soluções com poucos objetos e responsabilidade única
- Mantenha o front desacoplado da lógica de negocio

## Arquitetura

- Smart components orquestram dados e serviços
- Dumb components somente recebem `@Input()` e emitem `@Output()`
- `shared/` deve conter UI, enums, validadores e tipos reutilizáveis
- `core/` deve conter serviços HTTP e persistência
- `features/` deve conter domínios isolados e rotas lazy

## Nomenclatura

- `kebab-case` para arquivos
- `PascalCase` para classes e enums
- `camelCase` para variáveis
- Interfaces sem prefixo `I`

## TypeScript

- Use `strict` e tipagem explícita quando necessário
- Evite `any`
- Prefira `unknown` em vez de `any` quando incerto

## Angular

- Prefira standalone components e `OnPush`
- Use Reactive Forms (`FormGroup`, `FormControl`, `FormBuilder`)
- Use `@Input()`/`@Output()` tradicionais, não signals
- Use `TranslateService` ou `TranslatePipe` para textos dinâmicos
- Use `NgOptimizedImage` para imagens estáticas

## Templates

- Evite lógica complexa no template
- Use `async pipe` para observables
- Prefira `@if`, `@for`, `@switch` em vez de diretivas estruturais clássicas
- Use `class` bindings; evite `ngClass` e `ngStyle`

## Serviços

- Serviços devem ser single responsibility
- Use `providedIn: 'root'`
- Tipifique os retornos HTTP
- Separe DTOs de criação/atualização das interfaces de leitura

## Acessibilidade

- Passe AXE
- Siga WCAG AA para foco, contraste e ARIA

## Referências de skill

- Consulte `project-guidelines/SKILL-rxjs-reactive-patterns.md` para RxJS e HTTP
- Consulte `project-guidelines/SKILL-data-modeling-contracts.md` para DTOs, modelos e enums
- Consulte `project-guidelines/SKILL.md` para arquitetura local e separação de responsabilidades
