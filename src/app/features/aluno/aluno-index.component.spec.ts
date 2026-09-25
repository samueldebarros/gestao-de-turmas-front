import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AlunoFacadeService } from '../../core/facades/aluno-facade.service';
import { FeriadoFacadeService } from '../../core/facades/feriado-facade.service';
import { SexoEnum } from '../../shared/enums/sexo.enum';
import { OrdenacaoAlunoEnum } from '../../shared/enums/ordenacao-aluno.enum';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { AlunoIndex } from './aluno-index.component';

const criarAluno = (parcial: Partial<AlunoInterface> = {}): AlunoInterface => ({
  id: 7,
  matricula: '2026001',
  nome: 'Ana Souza',
  cpf: '52998224725',
  email: 'ana.souza@escola.com',
  sexo: SexoEnum.FEMININO,
  dataNascimento: new Date(2008, 2, 12),
  ativo: true,
  ...parcial,
});

const VALORES_VALIDOS = {
  nome: '  Ana Souza  ',
  cpf: '  52998224725  ',
  email: 'ana.souza@escola.com',
  dataNascimento: '2008-03-12',
  sexo: SexoEnum.FEMININO,
};

describe('AlunoIndex: orquestração do cadastro', () => {
  let fixture: ComponentFixture<AlunoIndex>;
  let componente: AlunoIndex;
  let facadeFake: {
    resultado$: Observable<unknown>;
    ordenacaoAtual$: Observable<unknown>;
    adicionar: ReturnType<typeof vi.fn>;
    editar: ReturnType<typeof vi.fn>;
    inativar: ReturnType<typeof vi.fn>;
    reativar: ReturnType<typeof vi.fn>;
    aplicarFiltros: ReturnType<typeof vi.fn>;
    mudarPagina: ReturnType<typeof vi.fn>;
    ordenarPor: ReturnType<typeof vi.fn>;
    buscarSugestoes: ReturnType<typeof vi.fn>;
  };

  const preencherFormulario = (valores = VALORES_VALIDOS) => {
    componente.alunoForm.patchValue(valores);
  };

  beforeEach(() => {
    facadeFake = {
      resultado$: of({ itens: [], paginaAtual: 1, totalPaginas: 0, totalResultados: 0 }),
      ordenacaoAtual$: of(null),
      adicionar: vi.fn(() => of(void 0)),
      editar: vi.fn(() => of(void 0)),
      inativar: vi.fn(() => of(void 0)),
      reativar: vi.fn(() => of(void 0)),
      aplicarFiltros: vi.fn(),
      mudarPagina: vi.fn(),
      ordenarPor: vi.fn(),
      buscarSugestoes: vi.fn(() => of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AlunoFacadeService, useValue: facadeFake },
        { provide: FeriadoFacadeService, useValue: { feriadosAnoAtual$: of([]) } },
      ],
    });
    TestBed.overrideTemplate(AlunoIndex, '');

    fixture = TestBed.createComponent(AlunoIndex);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('formulário inválido não toca a rede', () => {
    it('cadastro com formulário vazio alerta no modal e não chama o Facade', () => {
      componente.abrirModal();

      componente.salvarAluno();

      expect(componente.alertaModal()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.FORMULARIO_INVALIDO',
      });
      expect(facadeFake.adicionar).not.toHaveBeenCalled();
    });

    it('edição com formulário inválido também não chama o Facade', () => {
      componente.abrirModalEdicao(criarAluno());
      componente.alunoForm.patchValue({ nome: 'ab' });

      componente.salvarAluno();

      expect(componente.alertaModal().texto).toBe('MENSAGEM.FORMULARIO_INVALIDO');
      expect(facadeFake.editar).not.toHaveBeenCalled();
    });

    it('formulário inválido mantém o modal aberto', () => {
      componente.abrirModal();

      componente.salvarAluno();

      expect(componente.modalAberto()).toBe(true);
    });

    it('e-mail com espaços em volta é recusado pelo formulário, não corrigido no envio', () => {
      componente.abrirModal();
      preencherFormulario({ ...VALORES_VALIDOS, email: '  ana.souza@escola.com  ' });

      componente.salvarAluno();

      expect(facadeFake.adicionar).not.toHaveBeenCalled();
      expect(componente.alertaModal().texto).toBe('MENSAGEM.FORMULARIO_INVALIDO');
    });

    it('submeter inválido marca todo o formulário como touched, para os campos exibirem erro', () => {
      componente.abrirModal();

      componente.salvarAluno();

      expect(componente.alunoForm.touched).toBe(true);
    });
  });

  describe('cadastro bem-sucedido', () => {
    it('envia o DTO com trim nos textos e sexo convertido para número', () => {
      componente.abrirModal();
      preencherFormulario();

      componente.salvarAluno();

      expect(facadeFake.adicionar).toHaveBeenCalledWith({
        nome: 'Ana Souza',
        cpf: '52998224725',
        email: 'ana.souza@escola.com',
        dataNascimento: '2008-03-12',
        sexo: SexoEnum.FEMININO,
      });
    });

    it('sucesso alerta na página e fecha o modal', () => {
      componente.abrirModal();
      preencherFormulario();

      componente.salvarAluno();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'MENSAGEM.SUCESSO_CADASTRO_ALUNO',
      });
      expect(componente.modalAberto()).toBe(false);
    });

    it('fechar o modal limpa o formulário', () => {
      componente.abrirModal();
      preencherFormulario();

      componente.salvarAluno();

      expect(componente.alunoForm.value.nome).toBeNull();
    });
  });

  describe('falha do servidor', () => {
    it('alerta erro no modal e mantém o modal aberto', () => {
      facadeFake.adicionar = vi.fn(() => throwError(() => new Error('500')));
      componente.abrirModal();
      preencherFormulario();

      componente.salvarAluno();

      expect(componente.alertaModal()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.ERRO_CADASTRO_ALUNO',
      });
      expect(componente.modalAberto()).toBe(true);
    });

    it('nenhuma exceção escapa para quem chamou', () => {
      facadeFake.editar = vi.fn(() => throwError(() => new Error('500')));
      componente.abrirModalEdicao(criarAluno());
      preencherFormulario();

      expect(() => componente.salvarAluno()).not.toThrow();
    });
  });

  describe('salvarAluno roteia pelo estado do modal', () => {
    it('estado adicionar chama adicionar e nunca editar', () => {
      componente.abrirModal();
      preencherFormulario();

      componente.salvarAluno();

      expect(facadeFake.adicionar).toHaveBeenCalledTimes(1);
      expect(facadeFake.editar).not.toHaveBeenCalled();
    });

    it('estado editar chama editar com o id do aluno carregado, e nunca adicionar', () => {
      componente.abrirModalEdicao(criarAluno({ id: 42 }));
      preencherFormulario();

      componente.salvarAluno();

      expect(facadeFake.editar).toHaveBeenCalledWith({
        id: 42,
        nome: 'Ana Souza',
        email: 'ana.souza@escola.com',
        dataNascimento: '2008-03-12',
        sexo: SexoEnum.FEMININO,
      });
      expect(facadeFake.adicionar).not.toHaveBeenCalled();
    });

    it('a edição não envia cpf, porque o campo é imutável', () => {
      componente.abrirModalEdicao(criarAluno());
      preencherFormulario();

      componente.salvarAluno();

      expect(facadeFake.editar.mock.calls[0][0]).not.toHaveProperty('cpf');
    });
  });

  describe('abrirModalEdicao', () => {
    it('formata a data do aluno para o contrato yyyy-MM-dd do date-picker', () => {
      componente.abrirModalEdicao(criarAluno({ dataNascimento: new Date(2008, 2, 12) }));

      expect(componente.alunoForm.get('dataNascimento')?.value).toBe('2008-03-12');
    });

    it('desabilita o cpf, porque o servidor não aceita alteração', () => {
      componente.abrirModalEdicao(criarAluno());

      expect(componente.alunoForm.get('cpf')?.disabled).toBe(true);
    });

    it('o título e o rótulo do submit trocam com o modo', () => {
      componente.abrirModal();
      expect(componente.tituloModal()).toBe('ALUNO.MODAL.CADASTRO_TITULO');
      expect(componente.rotuloSubmit()).toBe('ALUNO.BOTOES.ADICIONAR_ALUNO');

      componente.abrirModalEdicao(criarAluno());
      expect(componente.tituloModal()).toBe('ALUNO.MODAL.EDICAO_TITULO');
      expect(componente.rotuloSubmit()).toBe('ALUNO.BOTOES.SALVAR_ALTERACOES');
    });
  });

  describe('a invariante do cpf desabilitado', () => {
    it('fechar o modal de edição reabilita o cpf', () => {
      componente.abrirModalEdicao(criarAluno());

      componente.fecharModal();

      expect(componente.alunoForm.get('cpf')?.disabled).toBe(false);
    });

    it('depois de editar e fechar, um cadastro novo ainda envia o cpf', () => {
      componente.abrirModalEdicao(criarAluno());
      componente.fecharModal();

      componente.abrirModal();
      preencherFormulario();
      componente.salvarAluno();

      expect(facadeFake.adicionar).toHaveBeenCalledWith(
        expect.objectContaining({ cpf: '52998224725' }),
      );
    });
  });

  describe('definirAcao traduz o evento genérico da tabela em intenção', () => {
    it('reativar chama o Facade diretamente com o id do item', () => {
      componente.definirAcao({ acaoId: 'reativar', item: criarAluno({ id: 13 }) });

      expect(facadeFake.reativar).toHaveBeenCalledWith(13);
    });

    it('inativar chama o Facade com o id do item, depois de confirmado', () => {
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ id: 13 }) });
      componente.confirmar();

      expect(facadeFake.inativar).toHaveBeenCalledWith(13);
    });

    it('editar abre o modal de edição em vez de chamar o Facade', () => {
      componente.definirAcao({ acaoId: 'editar', item: criarAluno() });

      expect(componente.modalAberto()).toBe(true);
      expect(componente.tituloModal()).toBe('ALUNO.MODAL.EDICAO_TITULO');
      expect(facadeFake.editar).not.toHaveBeenCalled();
    });

    it('ação desconhecida não quebra nem chama o Facade', () => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(() =>
        componente.definirAcao({ acaoId: 'explodir', item: criarAluno() }),
      ).not.toThrow();

      expect(facadeFake.inativar).not.toHaveBeenCalled();
      expect(facadeFake.reativar).not.toHaveBeenCalled();
      expect(componente.modalAberto()).toBe(false);
      aviso.mockRestore();
    });

    it('inativar com sucesso alerta na página', () => {
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno() });
      componente.confirmar();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'MENSAGEM.SUCESSO_INATIVAR_ALUNO',
      });
    });

    it('inativar que falha alerta erro na página', () => {
      facadeFake.inativar = vi.fn(() => throwError(() => new Error('404')));

      componente.definirAcao({ acaoId: 'inativar', item: criarAluno() });
      componente.confirmar();

      expect(componente.alertaPagina().tipo).toBe('erro');
      expect(componente.alertaPagina().texto).toBe('MENSAGEM.ERRO_INATIVAR_ALUNO');
    });

    it('422 ao inativar sem codigo utilizável cai na chave genérica de regra de negócio', () => {
      facadeFake.inativar = vi.fn(() =>
        throwError(() => ({
          status: 422,
          error: {
            error: new SyntaxError('...'),
            text: 'O aluno possui matrículas ativas.',
          },
        })),
      );

      componente.definirAcao({ acaoId: 'inativar', item: criarAluno() });
      componente.confirmar();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.ERRO_REGRA_NEGOCIO_ALUNO',
      });
    });

    it('erro sem 422 ao inativar cai na chave genérica', () => {
      facadeFake.inativar = vi.fn(() => throwError(() => ({ status: 500 })));

      componente.definirAcao({ acaoId: 'inativar', item: criarAluno() });
      componente.confirmar();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.ERRO_INATIVAR_ALUNO',
      });
    });
  });

  describe('repasses diretos ao Facade', () => {
    it('filtrar a tabela repassa o filtro', () => {
      const filtro = { pesquisa: 'ana' } as FiltroListaInterface;

      componente.filtrarTabela(filtro);

      expect(facadeFake.aplicarFiltros).toHaveBeenCalledWith(filtro);
    });

    it('mudar de página repassa o número', () => {
      componente.mudarPagina(3);

      expect(facadeFake.mudarPagina).toHaveBeenCalledWith(3);
    });

    it('ordenar repassa o campo', () => {
      componente.ordenar(OrdenacaoAlunoEnum.NOME);

      expect(facadeFake.ordenarPor).toHaveBeenCalledWith(OrdenacaoAlunoEnum.NOME);
    });

    it('a busca do autocomplete delega ao Facade sem transformar o termo', () => {
      componente.buscarAluno('ana');

      expect(facadeFake.buscarSugestoes).toHaveBeenCalledWith('ana');
    });
  });

  describe('alertas', () => {
    it('nasce sem alerta visível', () => {
      expect(componente.alertaPagina().visivel).toBe(false);
      expect(componente.alertaModal().visivel).toBe(false);
    });

    it('ocultar mantém o texto e só apaga a visibilidade', () => {
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno() });
      componente.confirmar();

      componente.ocultarAlertaPagina();

      expect(componente.alertaPagina().visivel).toBe(false);
      expect(componente.alertaPagina().texto).toBe('MENSAGEM.SUCESSO_INATIVAR_ALUNO');
    });
  });

  describe('configuração da tabela', () => {
    const coluna = (chave: string) => componente.colunas.find((c) => c.chave === chave)!;

    it('o cpf chega mascarado à célula, nunca completo', () => {
      const exibido = coluna('cpf').formatador!('52998224725');

      expect(exibido).not.toContain('52998224725');
      expect(exibido).toContain('*');
    });

    it('a data de nascimento é exibida em dd/MM/yyyy', () => {
      expect(coluna('dataNascimento').formatador!(new Date(2008, 2, 12))).toBe('12/03/2008');
    });

    it.each([
      { ativo: true, classe: 'badge badge-ativo', rotulo: 'ALUNO.FORMULARIO.STATUS_ATIVO' },
      { ativo: false, classe: 'badge badge-inativo', rotulo: 'ALUNO.FORMULARIO.STATUS_INATIVO' },
    ])('status $ativo vira badge própria e chave i18n própria', ({ ativo, classe, rotulo }) => {
      expect(coluna('ativo').cssClassCelula!(ativo)).toBe(classe);
      expect(coluna('ativo').formatador!(ativo)).toBe(rotulo);
    });

    it('somente matrícula, nome e data de nascimento são ordenáveis, porque o servidor recusa as outras', () => {
      const ordenaveis = componente.colunas.filter((c) => c.chaveOrdenacao != null);

      expect(ordenaveis.map((c) => c.chave)).toEqual(['matricula', 'nome', 'dataNascimento']);
    });

    it('nenhum título de coluna é texto cru, todos são chave i18n', () => {
      const titulos = componente.colunas.map((c) => c.titulo);

      expect(titulos.every((titulo) => titulo.startsWith('TABELA.COLUNAS.ALUNO.'))).toBe(true);
    });

    it.each([
      { acaoId: 'inativar', visivelPara: true },
      { acaoId: 'reativar', visivelPara: false },
    ])('$acaoId só aparece para aluno com ativo=$visivelPara', ({ acaoId, visivelPara }) => {
      const acao = componente.acoesTabela.find((a) => a.id === acaoId)!;

      expect(acao.condicaoVisibilidade!(criarAluno({ ativo: visivelPara }))).toBe(true);
      expect(acao.condicaoVisibilidade!(criarAluno({ ativo: !visivelPara }))).toBe(false);
    });

    it('editar aparece para qualquer aluno, sem condição', () => {
      const editar = componente.acoesTabela.find((a) => a.id === 'editar')!;

      expect(editar.condicaoVisibilidade).toBeUndefined();
    });

    it('o rótulo do autocomplete junta matrícula e nome', () => {
      expect(componente.rotuloAluno(criarAluno())).toBe('2026001 — Ana Souza');
    });
  });

  describe('importação', () => {
    it('concluir a importação fecha o painel e alerta sucesso', () => {
      componente.abrirImportar();

      componente.aoImportar({ totalCriados: 2, criados: [] });

      expect(componente.importarAberto()).toBe(false);
      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'IMPORTAR_ALUNOS.SUCESSO',
      });
    });

    it('cancelar a importação fecha o painel sem alertar nada', () => {
      componente.abrirImportar();

      componente.fecharImportar();

      expect(componente.importarAberto()).toBe(false);
      expect(componente.alertaPagina().visivel).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('reconstrói as opções de sexo a partir do enum, com rótulo vindo do pipe', () => {
      expect(componente.opcoesSexo).toEqual([
        { value: SexoEnum.MASCULINO, label: 'ALUNO.FORMULARIO.SEXO_MASCULINO' },
        { value: SexoEnum.FEMININO, label: 'ALUNO.FORMULARIO.SEXO_FEMININO' },
        { value: SexoEnum.OUTRO, label: 'ALUNO.FORMULARIO.SEXO_OUTRO' },
      ]);
    });
  });

  describe('vazamento de assinatura', () => {
    it('não anuncia nada depois de destruído', () => {
      const emissor = new Subject<void>();
      facadeFake.inativar = vi.fn(() => emissor.asObservable());
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno() });
      componente.confirmar();

      fixture.destroy();
      emissor.next();

      expect(componente.alertaPagina().visivel).toBe(false);
    });
  });

  describe('confirmação ao inativar', () => {
    it('inativar não chama o Facade sem confirmação', () => {
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ id: 9 }) });

      expect(facadeFake.inativar).not.toHaveBeenCalled();
    });

    it('confirmar chama o Facade uma única vez, com o id do aluno pendente', () => {
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ id: 9 }) });

      componente.confirmar();

      expect(facadeFake.inativar).toHaveBeenCalledTimes(1);
      expect(facadeFake.inativar).toHaveBeenCalledWith(9);
    });

    it('reativar continua chamando o Facade diretamente, sem confirmação', () => {
      componente.definirAcao({ acaoId: 'reativar', item: criarAluno({ id: 9 }) });

      expect(facadeFake.reativar).toHaveBeenCalledWith(9);
      expect(facadeFake.inativar).not.toHaveBeenCalled();
    });

    it('inativar deixa a ação em voo, desabilitando só a linha do aluno confirmado', () => {
      const chamada$ = new Subject<void>();
      facadeFake.inativar = vi.fn(() => chamada$.asObservable());

      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ id: 5 }) });
      componente.confirmar();

      const inativar = componente.acoesTabela.find((acao) => acao.id === 'inativar');
      expect(inativar?.desabilitada?.(criarAluno({ id: 5 }))).toBe(true);
      expect(inativar?.desabilitada?.(criarAluno({ id: 9 }))).toBe(false);

      chamada$.next();
      chamada$.complete();

      expect(inativar?.desabilitada?.(criarAluno({ id: 5 }))).toBe(false);
    });

    it('a confirmação pendente nomeia o aluno a inativar e some depois de confirmada', () => {
      expect(componente.confirmacaoPendente()).toBeNull();

      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ nome: 'Bruna Reis' }) });

      expect(componente.confirmacaoPendente()).toEqual({
        titulo: 'CONFIRMACAO.TITULO',
        mensagem: 'ALUNO.CONFIRMACAO.INATIVAR',
        params: { nome: 'Bruna Reis' },
        rotuloConfirmar: 'CONFIRMACAO.CONFIRMAR',
        variante: 'perigo',
      });

      componente.confirmar();

      expect(componente.confirmacaoPendente()).toBeNull();
    });

    it('cancelar descarta a pendência: confirmar depois não chama o Facade', () => {
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ id: 9 }) });
      componente.cancelarAcaoPendente();

      expect(componente.confirmacaoPendente()).toBeNull();

      componente.confirmar();

      expect(facadeFake.inativar).not.toHaveBeenCalled();
    });

    it('confirmar de novo o aluno ainda em voo não dispara segunda inativação', () => {
      const chamada$ = new Subject<void>();
      facadeFake.inativar = vi.fn(() => chamada$.asObservable());

      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ id: 5 }) });
      componente.confirmar();
      componente.definirAcao({ acaoId: 'inativar', item: criarAluno({ id: 5 }) });
      componente.confirmar();

      expect(facadeFake.inativar).toHaveBeenCalledTimes(1);

      chamada$.complete();
    });
  });

  describe('alerta com params, observado no DOM', () => {
    const montarComTemplate = () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: AlunoFacadeService, useValue: facadeFake },
          { provide: FeriadoFacadeService, useValue: { feriadosAnoAtual$: of([]) } },
        ],
      });
      const traducao = TestBed.inject(TranslateService);
      traducao.setTranslation('pt-BR', {
        ERRO_NEGOCIO: {
          ALUNO_MATRICULA_ATIVA: '{{nome}} possui {{quantidade}} matrícula(s) ativa(s).',
        },
      });
      traducao.use('pt-BR');

      fixture = TestBed.createComponent(AlunoIndex);
      componente = fixture.componentInstance;
      fixture.detectChanges();
    };

    it('inativação recusada com 422 com codigo e params interpola os dois valores distintos no alerta de página', () => {
      facadeFake.inativar = vi.fn(() =>
        throwError(() => ({
          status: 422,
          error: {
            codigo: 'ALUNO_MATRICULA_ATIVA',
            params: { nome: 'Bruna', quantidade: 4 },
            mensagem: 'O aluno possui matrículas ativas.',
          },
        })),
      );
      montarComTemplate();

      componente.definirAcao({ acaoId: 'inativar', item: criarAluno() });
      componente.confirmar();
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).querySelector(
        '.alerta-pagina .caixa-mensagem',
      )?.textContent;
      expect(texto).toContain('Bruna');
      expect(texto).toContain('4 matrícula');
    });

    it('cadastro recusado com 422 com codigo e params interpola os dois valores distintos no alerta do modal', () => {
      facadeFake.adicionar = vi.fn(() =>
        throwError(() => ({
          status: 422,
          error: {
            codigo: 'ALUNO_MATRICULA_ATIVA',
            params: { nome: 'Carla', quantidade: 7 },
            mensagem: 'O aluno possui matrículas ativas.',
          },
        })),
      );
      montarComTemplate();

      componente.abrirModal();
      preencherFormulario();
      componente.salvarAluno();
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).querySelector(
        'app-modal .caixa-mensagem',
      )?.textContent;
      expect(texto).toContain('Carla');
      expect(texto).toContain('7 matrícula');
    });
  });
});
