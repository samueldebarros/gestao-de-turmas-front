import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { OrdenacaoTabela } from '../../shared/interfaces/ui/ordenaca-tabela.interface';
import { DisciplinaFacadeService } from '../../core/facades/disciplina-facade.service';
import { DisciplinaInterface } from '../../shared/interfaces/entities/disciplina.interface';
import { DocenteDetalheInterface } from '../../shared/interfaces/entities/docente-detalhe.interface';
import { DocenteFacadeService } from '../../core/facades/docente-facade.service';
import { OrdenacaoDocenteEnum } from '../../shared/enums/ordenacao-docente.enum';
import { DocenteListaInterface } from '../../shared/interfaces/entities/docente-lista.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { DocenteIndexComponent } from './docente-index.component';

const ATIVO: DocenteListaInterface = {
  id: 11,
  nome: 'Valentina Professora',
  email: 'valentina.professora@edu.com.br',
  disciplinaNome: 'Engenharia de Requisitos',
  ativo: true,
};

const INATIVO: DocenteListaInterface = {
  id: 5,
  nome: 'Arthur Professor',
  email: 'arthur.professor@email.com',
  disciplinaNome: null,
  ativo: false,
};

// Do CONTRATO-DOCENTES-CADASTRO-CAPTURADO.md §1 — Geografia e Historia sao as
// duas inativas que o servidor devolve de proposito.
const DISCIPLINAS: DisciplinaInterface[] = [
  { id: 2, nome: 'Programação', ativo: true },
  { id: 5, nome: 'Química', ativo: true },
  { id: 8, nome: 'Geografia', ativo: false },
];

// §4 do contrato — docente 3, com disciplinaId numerico preenchido.
const DETALHE_COM_DISCIPLINA: DocenteDetalheInterface = {
  id: 3,
  nome: 'Leandro Professor',
  email: 'leandro.professor@email.com',
  dataNascimento: '1997-07-16',
  disciplinaId: 2,
  ativo: true,
};

const DETALHE_SEM_DISCIPLINA: DocenteDetalheInterface = {
  id: 16,
  nome: 'Teste Docente Sem Disciplina',
  email: 'teste.semdisc@email.com',
  dataNascimento: '1985-11-22',
  disciplinaId: null,
  ativo: true,
};

const DETALHE_COM_DISCIPLINA_INATIVA: DocenteDetalheInterface = {
  ...DETALHE_COM_DISCIPLINA,
  disciplinaId: 8,
};

const PAGINA: ResultadoPaginado<DocenteListaInterface> = {
  itens: [ATIVO, INATIVO],
  paginaAtual: 1,
  totalPaginas: 4,
  totalResultados: 14,
  tamanhoPagina: 4,
};

describe('DocenteIndexComponent', () => {
  let fixture: ComponentFixture<DocenteIndexComponent>;
  let componente: DocenteIndexComponent;
  let facade: {
    resultado$: Observable<ResultadoPaginado<DocenteListaInterface>>;
    ordenacaoAtual$: Observable<OrdenacaoTabela | null>;
    aplicarFiltros: Mock;
    mudarPagina: Mock;
    ordenarPor: Mock;
    inativar: Mock;
    reativar: Mock;
    carregarDetalhe: Mock;
    adicionar: Mock;
    editar: Mock;
  };
  let disciplinaFacade: { disciplinas$: Observable<DisciplinaInterface[]> };

  const montar = () => {
    TestBed.configureTestingModule({
      imports: [DocenteIndexComponent],
      providers: [
        { provide: DocenteFacadeService, useValue: facade },
        { provide: DisciplinaFacadeService, useValue: disciplinaFacade },
      ],
    });
    fixture = TestBed.createComponent(DocenteIndexComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  };

  const preencherFormularioValido = () => {
    componente.docenteForm.patchValue({
      nome: 'Docente Novo',
      cpf: '529.982.247-25',
      email: 'novo@escola.br',
      dataNascimento: '1990-05-10',
    });
  };

  const campoCpf = () =>
    fixture.nativeElement.querySelector('app-form-field-text[formControlName="cpf"]');

  beforeEach(() => {
    facade = {
      resultado$: of(PAGINA),
      ordenacaoAtual$: of(null),
      aplicarFiltros: vi.fn(),
      mudarPagina: vi.fn(),
      ordenarPor: vi.fn(),
      inativar: vi.fn(() => of(undefined)),
      reativar: vi.fn(() => of(undefined)),
      carregarDetalhe: vi.fn(() => of(DETALHE_COM_DISCIPLINA)),
      adicionar: vi.fn(() => of(undefined)),
      editar: vi.fn(() => of(undefined)),
    };
    disciplinaFacade = { disciplinas$: of(DISCIPLINAS) };
  });

  describe('configuração da tabela', () => {
    it('só Nome e Disciplina são ordenáveis', () => {
      montar();

      const ordenaveis = componente.colunas
        .filter((coluna) => coluna.chaveOrdenacao != null)
        .map((coluna) => coluna.chaveOrdenacao);

      expect(ordenaveis).toEqual([OrdenacaoDocenteEnum.NOME, OrdenacaoDocenteEnum.DISCIPLINA]);
    });

    it('docente sem disciplina exibe indicação própria, não célula vazia', () => {
      montar();

      const coluna = componente.colunas.find((c) => c.chave === 'disciplinaNome');

      expect(coluna?.formatador?.(null)).toBe('DOCENTE.SEM_DISCIPLINA');
      expect(coluna?.formatador?.('Física')).toBe('Física');
    });

    it('nenhum título de coluna é texto cru — todos são chave i18n', () => {
      montar();

      for (const coluna of componente.colunas) {
        expect(coluna.titulo).toMatch(/^[A-Z0-9_]+(\.[A-Z0-9_]+)*$/);
      }
    });

    it('inativar só aparece para ativo; reativar só para inativo', () => {
      montar();

      const inativar = componente.acoesTabela.find((acao) => acao.id === 'inativar');
      const reativar = componente.acoesTabela.find((acao) => acao.id === 'reativar');

      expect(inativar?.condicaoVisibilidade?.(ATIVO)).toBe(true);
      expect(inativar?.condicaoVisibilidade?.(INATIVO)).toBe(false);
      expect(reativar?.condicaoVisibilidade?.(ATIVO)).toBe(false);
      expect(reativar?.condicaoVisibilidade?.(INATIVO)).toBe(true);
    });
  });

  describe('orquestração — traduz evento genérico em intenção concreta', () => {
    it('repassa filtro, página e ordenação ao Facade', () => {
      montar();
      const filtro = { pesquisa: 'ana' } as FiltroListaInterface;

      componente.filtrarTabela(filtro);
      componente.mudarPagina(3);
      componente.ordenar(OrdenacaoDocenteEnum.DISCIPLINA);

      expect(facade.aplicarFiltros).toHaveBeenCalledWith(filtro);
      expect(facade.mudarPagina).toHaveBeenCalledWith(3);
      expect(facade.ordenarPor).toHaveBeenCalledWith(OrdenacaoDocenteEnum.DISCIPLINA);
    });

    it.each([
      { acaoId: 'inativar', item: ATIVO, metodo: 'inativar' },
      { acaoId: 'reativar', item: INATIVO, metodo: 'reativar' },
    ] as const)('$acaoId chama o Facade com o id do item', ({ acaoId, item, metodo }) => {
      montar();

      componente.definirAcao({ acaoId, item });

      expect(facade[metodo]).toHaveBeenCalledWith(item.id);
    });

    it('ignora ação desconhecida sem quebrar nem chamar o Facade', () => {
      montar();

      componente.definirAcao({ acaoId: 'exportar', item: ATIVO });

      expect(facade.inativar).not.toHaveBeenCalled();
      expect(facade.reativar).not.toHaveBeenCalled();
    });
  });

  describe('alertas', () => {
    it('nasce sem alerta visível', () => {
      montar();

      expect(componente.alertaPagina().visivel).toBe(false);
    });

    it('sucesso da mutação vira alerta de sucesso com chave i18n', () => {
      montar();

      componente.definirAcao({ acaoId: 'inativar', item: ATIVO });

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'MENSAGEM.SUCESSO_INATIVAR_DOCENTE',
      });
    });

    it('falha do servidor vira alerta de erro, e nenhuma exceção escapa', () => {
      facade.inativar = vi.fn(() => throwError(() => ({ status: 500 })));
      montar();

      expect(() => componente.definirAcao({ acaoId: 'inativar', item: ATIVO })).not.toThrow();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.ERRO_INATIVAR_DOCENTE',
      });
    });

    it('ocultar mantém o texto e só apaga a visibilidade', () => {
      montar();
      componente.definirAcao({ acaoId: 'inativar', item: ATIVO });

      componente.ocultarAlertaPagina();

      expect(componente.alertaPagina().visivel).toBe(false);
      expect(componente.alertaPagina().texto).toBe('MENSAGEM.SUCESSO_INATIVAR_DOCENTE');
    });
  });

  describe('estados de tela', () => {
    it('lista vazia mostra mensagem própria, não tabela', () => {
      facade.resultado$ = of({ ...PAGINA, itens: [], totalPaginas: 0, totalResultados: 0 });
      montar();

      const html = fixture.nativeElement.textContent as string;
      expect(html).toContain('DOCENTE.LISTA_VAZIA');
      expect(fixture.nativeElement.querySelector('app-tabela-generica')).toBeNull();
    });

    it('com resultados renderiza a tabela e não a mensagem de vazio', () => {
      montar();

      expect(fixture.nativeElement.querySelector('app-tabela-generica')).not.toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('DOCENTE.LISTA_VAZIA');
    });

    it('esconde a paginação quando há uma página só', () => {
      facade.resultado$ = of({ ...PAGINA, totalPaginas: 1 });
      montar();

      expect(fixture.nativeElement.querySelector('app-paginacao')).toBeNull();
    });
  });

  describe('abertura do modal', () => {
    it('nasce fechado', () => {
      montar();

      expect(componente.modalAberto()).toBe(false);
      expect(componente.modoModal()).toBe('fechado');
    });

    it('editar carrega o detalhe ANTES de abrir, e abre já com o docente dentro', () => {
      montar();

      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      expect(facade.carregarDetalhe).toHaveBeenCalledWith(ATIVO.id);
      expect(componente.modoModal()).toBe('editar');
      expect(componente.docenteForm.value.nome).toBe(DETALHE_COM_DISCIPLINA.nome);
    });

    // ⚠️ O GET /docentes/{id} responde 404 para docente inativo, porque o
    // repositorio filtra Ativo. Se o modal abrisse antes da resposta, o usuario
    // veria um formulario vazio e um alerta — dois estados contraditorios na tela.
    it('falha ao carregar o detalhe mostra alerta de página e NÃO abre o modal', () => {
      facade.carregarDetalhe = vi.fn(() => throwError(() => ({ status: 404 })));
      montar();

      expect(() => componente.definirAcao({ acaoId: 'editar', item: ATIVO })).not.toThrow();

      expect(componente.modalAberto()).toBe(false);
      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.ERRO_CARREGAR_DOCENTE',
      });
    });

    it('a ação Editar só aparece para docente ativo — o servidor recusa o inativo', () => {
      montar();

      const editar = componente.acoesTabela.find((acao) => acao.id === 'editar');

      expect(editar?.condicaoVisibilidade?.(ATIVO)).toBe(true);
      expect(editar?.condicaoVisibilidade?.(INATIVO)).toBe(false);
    });

    it('o título e o rótulo do submit trocam com o modo', () => {
      montar();

      componente.abrirModalAdicionar();
      expect(componente.tituloModal()).toBe('DOCENTE.MODAL.CADASTRO_TITULO');
      expect(componente.rotuloSubmit()).toBe('DOCENTE.BOTOES.ADICIONAR_DOCENTE');

      componente.definirAcao({ acaoId: 'editar', item: ATIVO });
      expect(componente.tituloModal()).toBe('DOCENTE.MODAL.EDICAO_TITULO');
      expect(componente.rotuloSubmit()).toBe('DOCENTE.BOTOES.SALVAR_ALTERACOES');
    });
  });

  describe('o campo CPF existe em adicionar e NÃO existe em editar', () => {
    // O EditarDocenteDTO nao tem Cpf: o campo e imutavel. Exibi-lo desabilitado —
    // como o AlunoIndex faz — traria dado pessoal ao navegador sem que ninguem
    // pudesse agir sobre ele. A asserção e sobre o DOM RENDERIZADO, e nao sobre
    // configuracao: na Fatia A um defeito passou porque todos os gates conferiam
    // configuracao e nenhum olhava o que a tela desenha.
    it('em adicionar, o campo CPF está no DOM', () => {
      montar();

      componente.abrirModalAdicionar();
      fixture.detectChanges();

      expect(campoCpf()).not.toBeNull();
    });

    it('em editar, o campo CPF NÃO está no DOM', () => {
      montar();

      componente.definirAcao({ acaoId: 'editar', item: ATIVO });
      fixture.detectChanges();

      expect(campoCpf()).toBeNull();
    });

    it('em editar o controle de cpf fica desabilitado, para não invalidar o form', () => {
      montar();

      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      expect(componente.docenteForm.controls.cpf.disabled).toBe(true);
    });
  });

  describe('validação do formulário', () => {
    it.each([{ modo: 'adicionar' }, { modo: 'editar' }] as const)(
      'data de nascimento vazia invalida o formulário no modo $modo',
      ({ modo }) => {
        montar();
        if (modo === 'adicionar') componente.abrirModalAdicionar();
        else componente.definirAcao({ acaoId: 'editar', item: ATIVO });

        preencherFormularioValido();
        componente.docenteForm.patchValue({ dataNascimento: '' });

        expect(componente.docenteForm.invalid).toBe(true);
      },
    );

    it('formulário inválido não chama o Facade e alerta dentro do modal', () => {
      montar();
      componente.abrirModalAdicionar();

      componente.salvarDocente();

      expect(facade.adicionar).not.toHaveBeenCalled();
      expect(componente.alertaModal().visivel).toBe(true);
      expect(componente.alertaModal().tipo).toBe('erro');
      expect(componente.alertaModal().texto).toBe('MENSAGEM.CORRIJA_OS_CAMPOS');
    });

    // ⚠️ O `exibirErro` dos tres componentes de campo e `invalid && touched`.
    // Sem o markAllAsTouched, submeter um formulario intocado acende ZERO
    // mensagens de campo — o usuario ve so o alerta e nenhuma indicacao de ONDE.
    it('submeter intocado marca todos os campos como touched, para os erros acenderem', () => {
      montar();
      componente.abrirModalAdicionar();

      expect(componente.docenteForm.controls.nome.touched).toBe(false);

      componente.salvarDocente();

      expect(componente.docenteForm.controls.nome.touched).toBe(true);
      expect(componente.docenteForm.controls.dataNascimento.touched).toBe(true);
    });

    it('as mensagens de erro aparecem RENDERIZADAS nos campos depois do submit', () => {
      montar();
      componente.abrirModalAdicionar();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.error-message')).toHaveLength(0);

      componente.salvarDocente();
      fixture.detectChanges();

      const mensagens = fixture.nativeElement.querySelectorAll('.error-message');
      expect(mensagens.length).toBeGreaterThan(0);
    });

    it('o alerta lista uma causa por campo inválido, cada uma nomeando o campo', () => {
      montar();
      componente.abrirModalAdicionar();

      componente.salvarDocente();

      const detalhes = componente.alertaModal().detalhes ?? [];
      expect(detalhes).toEqual([
        { campo: 'DOCENTE.FORMULARIO.NOME_LABEL', erro: 'VALIDACAO.OBRIGATORIO' },
        { campo: 'DOCENTE.FORMULARIO.CPF_LABEL', erro: 'VALIDACAO.OBRIGATORIO' },
        { campo: 'DOCENTE.FORMULARIO.DATA_NASCIMENTO_LABEL', erro: 'VALIDACAO.OBRIGATORIO' },
      ]);
    });

    // A causa de cada campo e a DELE, nao uma frase unica para todos: aqui o nome
    // e curto demais, o CPF e invalido e a data e futura — tres erros diferentes.
    it('causas diferentes em campos diferentes produzem mensagens diferentes', () => {
      montar();
      componente.abrirModalAdicionar();
      componente.docenteForm.patchValue({
        nome: 'Jo',
        cpf: '111.111.111-11',
        email: 'nao-e-email',
        dataNascimento: '2099-01-01',
      });

      componente.salvarDocente();

      const porCampo = new Map(
        (componente.alertaModal().detalhes ?? []).map((d) => [d.campo, d.erro]),
      );
      expect(porCampo.get('DOCENTE.FORMULARIO.NOME_LABEL')).toBe('VALIDACAO.TAMANHO_MINIMO');
      expect(porCampo.get('DOCENTE.FORMULARIO.CPF_LABEL')).toBe('VALIDACAO.CPF_INVALIDO');
      expect(porCampo.get('DOCENTE.FORMULARIO.EMAIL_LABEL')).toBe('VALIDACAO.EMAIL_INVALIDO');
      expect(porCampo.get('DOCENTE.FORMULARIO.DATA_NASCIMENTO_LABEL')).toBe(
        'VALIDACAO.DATA_FUTURA',
      );
    });

    it('o campo CPF desabilitado em edição não entra nas causas', () => {
      montar();
      componente.definirAcao({ acaoId: 'editar', item: ATIVO });
      componente.docenteForm.patchValue({ nome: '' });

      componente.salvarDocente();

      const campos = (componente.alertaModal().detalhes ?? []).map((d) => d.campo);
      expect(campos).not.toContain('DOCENTE.FORMULARIO.CPF_LABEL');
      expect(campos).toContain('DOCENTE.FORMULARIO.NOME_LABEL');
    });

    it('toda causa nomeia o campo por chave i18n, nunca pelo nome do controle', () => {
      montar();
      componente.abrirModalAdicionar();

      componente.salvarDocente();

      for (const detalhe of componente.alertaModal().detalhes ?? []) {
        expect(detalhe.campo).toMatch(/^[A-Z0-9_]+(\.[A-Z0-9_]+)*$/);
        expect(detalhe.erro).toMatch(/^[A-Z0-9_]+(\.[A-Z0-9_]+)*$/);
      }
    });

    // Guarda a duplicacao aceita: o rotulo de cada campo vive em DOIS lugares —
    // no template e no mapa ROTULO_DO_CAMPO. Se um controle novo entrar no form
    // sem entrada no mapa, a causa dele apareceria com o nome cru do controle.
    it('todo controle do formulário tem rótulo mapeado', () => {
      montar();
      componente.abrirModalAdicionar();
      for (const controle of Object.values(componente.docenteForm.controls)) {
        controle.setErrors({ required: true });
      }

      const causas = componente.causasDeInvalidez();

      expect(causas).toHaveLength(Object.keys(componente.docenteForm.controls).length);
      for (const causa of causas) {
        expect(causa.campo).toMatch(/^DOCENTE\.FORMULARIO\./);
      }
    });

    it('disciplina não é obrigatória: o formulário é válido sem escolher nenhuma', () => {
      montar();
      componente.abrirModalAdicionar();

      preencherFormularioValido();

      expect(componente.docenteForm.valid).toBe(true);
    });
  });

  describe('o DTO que sai do formulário', () => {
    it('adicionar envia os cinco campos, com o CPF', () => {
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();
      componente.docenteForm.patchValue({ disciplinaId: 2 });

      componente.salvarDocente();

      expect(facade.adicionar).toHaveBeenCalledWith({
        nome: 'Docente Novo',
        cpf: '529.982.247-25',
        email: 'novo@escola.br',
        dataNascimento: '1990-05-10',
        disciplinaId: 2,
      });
    });

    it('"Sem disciplina" vira disciplinaId null — não 0, não string vazia', () => {
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();

      componente.salvarDocente();

      const enviado = facade.adicionar.mock.calls[0][0];
      expect(enviado).toHaveProperty('disciplinaId');
      expect(enviado.disciplinaId).toBeNull();
    });

    it('e-mail vazio vira null, porque o servidor aceita Email nulo', () => {
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();
      componente.docenteForm.patchValue({ email: '' });

      expect(componente.docenteForm.valid).toBe(true);

      componente.salvarDocente();

      expect(facade.adicionar.mock.calls[0][0].email).toBeNull();
    });

    // `Validators.email` deixa passar string vazia mas reprova texto que nao e
    // e-mail — inclusive so-espacos. Este teste fixa a fronteira: "sem e-mail" e
    // um estado valido, "e-mail mal escrito" nao.
    it('e-mail só com espaços reprova, e nenhuma requisição sai', () => {
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();
      componente.docenteForm.patchValue({ email: '   ' });

      componente.salvarDocente();

      expect(componente.docenteForm.invalid).toBe(true);
      expect(facade.adicionar).not.toHaveBeenCalled();
    });

    it('editar envia o id do docente carregado e NÃO envia cpf', () => {
      montar();
      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      componente.salvarDocente();

      const enviado = facade.editar.mock.calls[0][0];
      expect(enviado.id).toBe(DETALHE_COM_DISCIPLINA.id);
      expect(enviado).not.toHaveProperty('cpf');
    });

    // ⚠️ O servidor faz `docenteExistente.DisciplinaId = docente.DisciplinaId`
    // INCONDICIONALMENTE. Omitir a chave nao significa "nao mexi": o vinculo e
    // APAGADO e o servidor ainda responde 204 de sucesso.
    it('editar sempre envia disciplinaId, inclusive quando o campo não foi tocado', () => {
      montar();
      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      componente.salvarDocente();

      const enviado = facade.editar.mock.calls[0][0];
      expect(enviado).toHaveProperty('disciplinaId');
      expect(enviado.disciplinaId).toBe(DETALHE_COM_DISCIPLINA.disciplinaId);
    });

    // O back usa DateOnly, que serializa "1997-07-16" — ja e o contrato do
    // date-picker. Este teste guarda a AUSENCIA de conversao: se alguem
    // acrescentar um DatePipe "por simetria com o AlunoIndex", ele reprova.
    it('a data de nascimento atravessa sem conversão nenhuma', () => {
      montar();
      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      expect(componente.docenteForm.value.dataNascimento).toBe(
        DETALHE_COM_DISCIPLINA.dataNascimento,
      );

      componente.salvarDocente();

      expect(facade.editar.mock.calls[0][0].dataNascimento).toBe('1997-07-16');
    });
  });

  describe('opções de disciplina', () => {
    it('a primeira opção é sempre "Sem disciplina"', () => {
      montar();

      expect(componente.opcoesDisciplina()[0]).toEqual({
        value: 0,
        label: 'DOCENTE.FORMULARIO.DISCIPLINA_NENHUMA',
      });
    });

    it('o rótulo é o nome da disciplina, não uma chave i18n', () => {
      montar();

      const rotulos = componente.opcoesDisciplina().map((opcao) => opcao.label);

      expect(rotulos).toContain('Programação');
    });

    it('esconde as inativas: o servidor recusa disciplina inativa com 422', () => {
      montar();
      componente.abrirModalAdicionar();

      const ids = componente.opcoesDisciplina().map((opcao) => opcao.value);

      expect(ids).toEqual([0, 2, 5]);
      expect(ids).not.toContain(8);
    });

    // ⚠️ O outro lado da moeda. Se o docente ESTIVER vinculado a uma disciplina
    // inativa, ela tem de aparecer: sem isso o select perde o valor vigente em
    // silencio, e salvar desvincularia o docente sem ninguem pedir.
    it('mas exibe a inativa quando é o vínculo atual do docente em edição', () => {
      facade.carregarDetalhe = vi.fn(() => of(DETALHE_COM_DISCIPLINA_INATIVA));
      montar();

      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      const ids = componente.opcoesDisciplina().map((opcao) => opcao.value);
      expect(ids).toContain(8);
    });

    it('docente sem disciplina abre o formulário na opção "Sem disciplina"', () => {
      facade.carregarDetalhe = vi.fn(() => of(DETALHE_SEM_DISCIPLINA));
      montar();

      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      expect(componente.docenteForm.value.disciplinaId).toBe(0);
    });

    it('falha ao carregar disciplinas mantém a tela usável, com alerta', () => {
      disciplinaFacade = { disciplinas$: throwError(() => ({ status: 500 })) };

      expect(() => montar()).not.toThrow();

      expect(componente.opcoesDisciplina()).toEqual([
        { value: 0, label: 'DOCENTE.FORMULARIO.DISCIPLINA_NENHUMA' },
      ]);
      expect(componente.alertaPagina().texto).toBe('MENSAGEM.ERRO_CARREGAR_DISCIPLINAS');
      expect(fixture.nativeElement.querySelector('app-tabela-generica')).not.toBeNull();
    });

    it('mesmo sem disciplinas o cadastro pode ser concluído', () => {
      disciplinaFacade = { disciplinas$: throwError(() => ({ status: 500 })) };
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();

      componente.salvarDocente();

      expect(facade.adicionar).toHaveBeenCalled();
      expect(facade.adicionar.mock.calls[0][0].disciplinaId).toBeNull();
    });
  });

  describe('gravação: sucesso fecha, erro mantém aberto', () => {
    it('sucesso do cadastro fecha o modal e alerta na página', () => {
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();

      componente.salvarDocente();

      expect(componente.modalAberto()).toBe(false);
      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'MENSAGEM.SUCESSO_CADASTRO_DOCENTE',
      });
    });

    // ⚠️ Fechar o modal no erro apagaria da tela tudo que o usuario digitou.
    it.each([
      { rotulo: 'cadastro', metodo: 'adicionar', chave: 'MENSAGEM.ERRO_CADASTRO_DOCENTE' },
      { rotulo: 'edição', metodo: 'editar', chave: 'MENSAGEM.ERRO_EDICAO_DOCENTE' },
    ] as const)('falha de $rotulo alerta no modal e NÃO fecha', ({ metodo, chave }) => {
      facade[metodo] = vi.fn(() => throwError(() => ({ status: 500 })));
      montar();
      if (metodo === 'adicionar') {
        componente.abrirModalAdicionar();
        preencherFormularioValido();
      } else {
        componente.definirAcao({ acaoId: 'editar', item: ATIVO });
      }

      expect(() => componente.salvarDocente()).not.toThrow();

      expect(componente.modalAberto()).toBe(true);
      expect(componente.alertaModal()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: chave,
        detalhes: [],
      });
    });

    // O 422 e regra de negocio: CPF duplicado, disciplina inativa, idade > 120.
    // O servidor manda a razao exata em text/plain, e ela e a UNICA informacao
    // que diz ao usuario qual campo corrigir. Mostrar um texto generico no lugar
    // faz erros diferentes parecerem o mesmo erro.
    it.each([
      { formato: 'corpo em string', error: 'A disciplina informada não existe ou está inativa.' },
      {
        formato: 'corpo embrulhado pelo HttpClient',
        error: {
          error: new SyntaxError('...'),
          text: 'A disciplina informada não existe ou está inativa.',
        },
      },
    ])('422 mostra a razão que o servidor mandou — $formato', ({ error }) => {
      facade.adicionar = vi.fn(() => throwError(() => ({ status: 422, error })));
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();

      componente.salvarDocente();

      expect(componente.alertaModal().texto).toBe(
        'A disciplina informada não existe ou está inativa.',
      );
    });

    it('422 cai na chave genérica quando o corpo não é aproveitável', () => {
      facade.adicionar = vi.fn(() => throwError(() => ({ status: 422, error: '<html></html>' })));
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();

      componente.salvarDocente();

      expect(componente.alertaModal().texto).toBe('MENSAGEM.ERRO_REGRA_NEGOCIO_DOCENTE');
    });

    it('erros diferentes produzem mensagens diferentes na segunda tentativa', () => {
      facade.adicionar = vi.fn(() =>
        throwError(() => ({ status: 422, error: 'Esse CPF já esta em uso.' })),
      );
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();
      componente.salvarDocente();
      expect(componente.alertaModal().texto).toBe('Esse CPF já esta em uso.');

      facade.adicionar = vi.fn(() =>
        throwError(() => ({ status: 422, error: 'A data de nascimento informada é inválida.' })),
      );
      componente.salvarDocente();

      expect(componente.alertaModal().texto).toBe('A data de nascimento informada é inválida.');
    });
  });

  describe('o formulário não vaza entre modos', () => {
    it('depois de editar e fechar, adicionar abre em branco', () => {
      montar();
      componente.definirAcao({ acaoId: 'editar', item: ATIVO });
      componente.fecharModal();

      componente.abrirModalAdicionar();

      expect(componente.docenteForm.value).toEqual({
        nome: '',
        cpf: '',
        email: '',
        dataNascimento: '',
        disciplinaId: 0,
      });
    });

    it('depois de editar e fechar, o controle de cpf volta habilitado', () => {
      montar();
      componente.definirAcao({ acaoId: 'editar', item: ATIVO });

      componente.fecharModal();

      expect(componente.docenteForm.controls.cpf.enabled).toBe(true);
    });

    it('cancelar não chama o Facade', () => {
      montar();
      componente.abrirModalAdicionar();
      preencherFormularioValido();

      componente.fecharModal();

      expect(facade.adicionar).not.toHaveBeenCalled();
      expect(facade.editar).not.toHaveBeenCalled();
    });
  });

  describe('i18n — nenhuma chave emprestada de outro domínio', () => {
    const NAMESPACES_PERMITIDOS = /^(DOCENTE|MENSAGEM|VALIDACAO|TABELA)\./;

    it('todo título de coluna é chave i18n do namespace certo', () => {
      montar();

      for (const coluna of componente.colunas) {
        expect(coluna.titulo).toMatch(NAMESPACES_PERMITIDOS);
      }
    });

    it('todo rótulo de ação é chave i18n do namespace certo', () => {
      montar();

      for (const acao of componente.acoesTabela) {
        expect(acao.rotulo).toMatch(NAMESPACES_PERMITIDOS);
      }
    });

    // A divida D4 nasceu de o docente reusar chaves de ALUNO. O gate R4 confere
    // titulo de coluna; estes dois asseveram o resto da superficie do componente.
    it('título do modal, rótulo do submit e alertas são do namespace de docente', () => {
      montar();

      componente.abrirModalAdicionar();
      expect(componente.tituloModal()).toMatch(NAMESPACES_PERMITIDOS);
      expect(componente.rotuloSubmit()).toMatch(NAMESPACES_PERMITIDOS);

      componente.definirAcao({ acaoId: 'inativar', item: ATIVO });
      expect(componente.alertaPagina().texto).toMatch(NAMESPACES_PERMITIDOS);
    });
  });
});
