# Skill: Modelagem de Dados e Contratos (Classes, DTOs, Enums)

## Hierarquia de Classes e Interfaces

- Crie `EntidadeBaseInterface` com campos comuns: `id: number`, `ativo?: boolean`.
- Todas as entidades estendem `EntidadeBaseInterface`.
- Crie classe concreta `EntidadeBaseModel` implementando `EntidadeBaseInterface`.
- Entidades específicas (ex: `AlunoModel`) implementam interface própria E estendem a base.
- Padrão: `class AlunoModel implements AlunoInterface` onde `AlunoInterface extends EntidadeBaseInterface`.

## Interfaces e Contratos

- Nomeie interfaces sem prefixo "I" (ex: `AlunoInterface`, não `IAlunoInterface`).
- Use sufixo `Interface` em nomes (ex: `AlunoInterface`).
- Interfaces descrevem contrato de dados, classes implementam.
- Nunca misture lógica em interfaces; apenas propriedades tipadas.

## DTOs (Data Transfer Objects)

- Crie DTOs separados para operações específicas (ex: `AlunoCreateDTO` para POST).
- DTO pode omitir campos que vêm do servidor (ex: `id`, `ativo`).
- DTO para leitura: use a interface base ou modelo (ex: `AlunoInterface`).
- Tipifique rigidamente todo campo DTO; nunca use `any`.
- DTOs são interfaces leves, sem lógica.

## Enums

- Use String Enums com valores numéricos: `enum SexoEnum { MASCULINO = 1, FEMININO = 2, OUTRO = 3 }`.
- Nomeie enums em `PascalCase`; valores em `MAIUSCULA`.
- Valores de enum devem corresponder ao contrato de API/backend.
- Mapeie enums para opções de select dinâmicas em ngOnInit.
- Armazene descrição humana em `i18n`, nunca em código.

## Mapeamento Enum ↔ Opções de Select

- Extraia valores numéricos: `Object.values(SexoEnum).filter(v => typeof v === 'number')`.
- Mapeie para `SelectOptionInterface`: `{ value: enum, label: 'i18n.KEY' }`.
- Obtenha descrição traduzida dinamicamente: `this.translate.instant('ALUNO.FORMULARIO.SEXO_MASCULINO')`.
- Nunca hardcode descrições de enum em componente; use switch + i18n em método reutilizável.

## Validadores Customizados

- Implemente como classe estática com métodos `static`.
- Método principal retorna `ValidatorFn`: `static nomeValidator(): ValidatorFn`.
- `ValidatorFn` recebe `AbstractControl` e retorna `ValidationErrors | null`.
- Separe lógica de validação em métodos privados estáticos (ex: `validarCpfLogica`).
- Respeite SRP: cada método valida um aspecto (documento, idade, etc).

## Modelagem de Formulário

- Type FormGroup com generics: `FormGroup<{ campo: FormControl<tipo | null>; }>`.
- Inicialize valores em FormBuilder: `fb.group({ nome: ['valor', validadores] })`.
- Formulários de criação (AddAluno) devem usar DTO de envio.
- Nunca exponha entidade completa ao formulário; extraia apenas campos necessários.

## Transformação de Dados

- Converta Data para string API: `formato YYYY-MM-DD`.
- Converta strings de input para tipos tipados antes de enviar.
- Trim sempre strings de entrada: `formValues.nome!.trim()`.
- Mapeie tipos enum do form (number) para backend (string/number conforme contrato).

## I18n (Internacionalização)

- Todas as strings visíveis em português/inglês via `i18n/*.json`.
- Use chaves estruturadas: `ALUNO.FORMULARIO.NOME_LABEL`, `VALIDACAO.OBRIGATORIO`.
- Injete `TranslateService` em componentes que precisam tradução dinâmica.
- Use `translate.instant('CHAVE')` para síncrono, `async pipe` para observables.
- Nunca hardcode strings em componente; sempre referencie chave i18n.

## Anti-patterns

- ❌ Nunca use prefixo "I" em nomes de interface.
- ❌ Não misture DTO de entrada com resposta de API na mesma interface.
- ❌ Nunca use enum string com strings não-normalizadas (ex: "Masculino" vs "MASCULINO").
- ❌ Não mantenha descrição de enum em código; sempre use i18n.
- ❌ Nunca tipifique campo como `any` mesmo em DTO genérico; use `unknown` ou tipo specific.
- ❌ Não omita `implements Interface` em classes concretas.
- ❌ Nunca inicialize FormControl sem tipagem genérica.
