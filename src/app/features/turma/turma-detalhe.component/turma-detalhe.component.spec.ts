import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { DocenteFacadeService } from '../../../core/facades/docente-facade.service';
import { TurmaFacadeService } from '../../../core/facades/turma-facade.service';
import { SexoEnum } from '../../../shared/enums/sexo.enum';
import { SituacaoEnturmamentoEnum } from '../../../shared/enums/situacao-enturmamento.enum';
import { TurnoEnum } from '../../../shared/enums/turno.enum';
import { AlunoDaTurmaInterface } from '../../../shared/interfaces/entities/aluno-da-turma.interface';
import { DocenteSqlInterface } from '../../../shared/interfaces/entities/docente-sql.interface';
import { TurmaInterface } from '../../../shared/interfaces/entities/turma.interface';
import { TurmaDetalheComponent } from './turma-detalhe.component';

const TURMA: TurmaInterface = {
  id: 7,
  ativo: true,
  identificador: 'A',
  serie: 1,
  anoLetivo: 2026,
  turno: TurnoEnum.MATUTINO,
  capacidade: 30,
  totalAlunos: 3,
  totalDisciplinas: 2,
};

const criarAluno = (parcial: Partial<AlunoDaTurmaInterface> = {}): AlunoDaTurmaInterface => ({
  id: 1,
  matricula: '2026001',
  nome: 'Ana Souza',
  cpf: '12345678901',
  email: 'ana@escola.com',
  sexo: SexoEnum.FEMININO,
  dataNascimento: '2010-05-17',
  situacao: SituacaoEnturmamentoEnum.ATIVO,
  dataEnturmamento: '2026-02-13T00:00:00',
  ...parcial,
});

const DOCENTE: DocenteSqlInterface = {
  id: 4,
  docenteNome: 'Carlos Lima',
  docenteEmail: 'carlos@escola.com',
  disciplinaId: 11,
  disciplinaNome: 'Matemática',
  cargaHoraria: 60,
};

const DOCENTE_2: DocenteSqlInterface = {
  id: 5,
  docenteNome: 'Fernanda Reis',
  docenteEmail: 'fernanda@escola.com',
  disciplinaId: 11,
  disciplinaNome: 'Matemática',
  cargaHoraria: 40,
};

const DOCENTE_HISTORIA: DocenteSqlInterface = {
  id: 6,
  docenteNome: 'Marcos Alves',
  docenteEmail: 'marcos@escola.com',
  disciplinaId: 12,
  disciplinaNome: 'História',
  cargaHoraria: 40,
};

const TRADUCOES = {
  TURMA: {
    SITUACAO: { 1: 'Ativo', 3: 'Cancelado' },
    CONFIRMACAO: {
      ALOCAR: 'Alocar {{nome}} em {{disciplina}} nesta turma?',
      TROCAR_DOCENTE: '{{disciplina}} já está com {{atual}}. Substituir por {{nome}}?',
    },
    MENSAGEM: {
      DOCENTE_JA_ALOCADO: 'Este docente já leciona {{disciplina}} nesta turma.',
    },
    DETALHE: {
      VAGAS: '{{ativos}} de {{capacidade}} vagas ocupadas',
      REGISTROS: '{{total}} registro(s) de matrícula',
      ALUNOS: { TITULO: 'Alunos', ERRO: 'Erro ao carregar alunos', VAZIO: 'Sem alunos' },
      DOCENTES: {
        TITULO: 'Docentes',
        ERRO: 'Erro ao carregar docentes',
        VAZIO: 'Sem docentes',
        ERRO_LISTA: 'Erro ao carregar a lista de docentes',
        VAZIO_LISTA: 'Sem docentes para alocação',
      },
    },
  },
  ERRO_NEGOCIO: {
    TURMA_CAPACIDADE_ATINGIDA:
      'A turma atingiu a capacidade máxima. Capacidade: {{capacidade}}; alunos ativos: {{alunosAtivos}}.',
  },
};

describe('TurmaDetalheComponent', () => {
  let fixture: ComponentFixture<TurmaDetalheComponent>;
  let facade: {
    alunosDaTurma: Mock;
    docentesDaTurma: Mock;
    alunosDisponiveis: Mock;
    matricularAluno: Mock;
    cancelarMatricula: Mock;
    desvincularDisciplina: Mock;
    vincularDocente: Mock;
  };
  let docentesFacadeMock: Observable<unknown>;

  const dom = () => fixture.nativeElement as HTMLElement;

  const linhasDe = (bloco: string) =>
    dom().querySelectorAll(`[data-testid="bloco-${bloco}"] tbody tr`);

  const textoDe = (bloco: string) =>
    dom().querySelector(`[data-testid="bloco-${bloco}"]`)?.textContent ?? '';

  const montar = (turma: TurmaInterface = TURMA) => {
    TestBed.configureTestingModule({
      imports: [TurmaDetalheComponent],
      providers: [
        { provide: TurmaFacadeService, useValue: facade },
        { provide: DocenteFacadeService, useValue: { docentes$: docentesFacadeMock } },
      ],
    });
    const traducao = TestBed.inject(TranslateService);
    traducao.setTranslation('pt-BR', TRADUCOES);
    traducao.use('pt-BR');

    fixture = TestBed.createComponent(TurmaDetalheComponent);
    fixture.componentInstance.turma = turma;
    fixture.detectChanges();
  };

  beforeEach(() => {
    facade = {
      alunosDaTurma: vi.fn(() => of({ status: 'ok', itens: [criarAluno()] })),
      docentesDaTurma: vi.fn(() => of({ status: 'ok', itens: [DOCENTE] })),
      alunosDisponiveis: vi.fn(() => of([])),
      matricularAluno: vi.fn(() => of(undefined)),
      cancelarMatricula: vi.fn(() => of(undefined)),
      desvincularDisciplina: vi.fn(() => of(undefined)),
      vincularDocente: vi.fn(() => of(undefined)),
    };
    docentesFacadeMock = of({ status: 'ok', itens: [DOCENTE] });
  });

  it('pede as duas cargas para a turma recebida', () => {
    montar();

    expect(facade.alunosDaTurma).toHaveBeenCalledWith(TURMA.id);
    expect(facade.docentesDaTurma).toHaveBeenCalledWith(TURMA.id);
  });

  it('renderiza uma linha por aluno e por docente, cada uma no seu bloco', () => {
    montar();

    expect(linhasDe('alunos').length).toBe(1);
    expect(linhasDe('docentes').length).toBe(1);
  });

  it('traduz a situação da matrícula pela chave do enum', () => {
    facade.alunosDaTurma = vi.fn(() =>
      of({ status: 'ok', itens: [criarAluno({ situacao: SituacaoEnturmamentoEnum.CANCELADO })] }),
    );
    montar();

    expect(textoDe('alunos')).toContain('Cancelado');
  });

  it('conta só os ativos nas vagas ocupadas, e todos os registros no total', () => {
    facade.alunosDaTurma = vi.fn(() =>
      of({
        status: 'ok',
        itens: [
          criarAluno({ id: 1 }),
          criarAluno({ id: 2, situacao: SituacaoEnturmamentoEnum.CANCELADO }),
        ],
      }),
    );
    montar();

    const contagens = dom().querySelector('.detalhe__contagens')?.textContent ?? '';
    expect(contagens).toContain('1 de 30 vagas ocupadas');
    expect(contagens).toContain('2 registro(s) de matrícula');
  });

  it('a busca do autocomplete filtra localmente por nome ou matrícula', async () => {
    facade.alunosDisponiveis = vi.fn(() =>
      of([
        { id: 2, matricula: '2026002', nome: 'Bruno Lima' },
        { id: 3, matricula: '2026003', nome: 'Carla Dias' },
      ]),
    );
    montar();

    const componente = fixture.componentInstance as unknown as {
      buscarAluno: (termo: string) => Observable<{ nome: string }[]>;
      rotuloAluno: (aluno: { matricula: string; nome: string }) => string;
    };

    const porNome = await firstValueFrom(componente.buscarAluno('carla'));
    const porMatricula = await firstValueFrom(componente.buscarAluno('2026002'));

    expect(porNome.map((a) => a.nome)).toEqual(['Carla Dias']);
    expect(porMatricula.map((a) => a.nome)).toEqual(['Bruno Lima']);
    expect(componente.rotuloAluno({ matricula: '2026002', nome: 'Bruno Lima' })).toBe(
      '2026002 - Bruno Lima',
    );
  });

  it('selecionar no autocomplete matricula o aluno e anuncia sucesso no painel', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      matricular: (aluno: { id: number }) => void;
      alertaPainel: () => { visivel: boolean; tipo: string; texto: string };
    };

    componente.matricular({ id: 2 });

    expect(facade.matricularAluno).toHaveBeenCalledTimes(1);
    expect(facade.matricularAluno).toHaveBeenCalledWith(TURMA.id, { alunoId: 2 });
    expect(componente.alertaPainel()).toMatchObject({
      visivel: true,
      tipo: 'sucesso',
      texto: 'MENSAGEM.SUCESSO_MATRICULA',
    });
  });

  it('recusa 422 sem codigo utilizável cai na chave genérica de regra de negócio', () => {
    facade.matricularAluno = vi.fn(() =>
      throwError(() => ({
        status: 422,
        error: {
          error: new SyntaxError('...'),
          text: 'A turma atingiu a capacidade máxima.',
        },
      })),
    );
    montar();
    const componente = fixture.componentInstance as unknown as {
      matricular: (aluno: { id: number }) => void;
      alertaPainel: () => { tipo: string; texto: string };
    };

    componente.matricular({ id: 2 });

    expect(componente.alertaPainel()).toMatchObject({
      tipo: 'erro',
      texto: 'MENSAGEM.ERRO_REGRA_NEGOCIO_MATRICULA',
    });
  });

  it('erro sem 422 cai na chave genérica, não no corpo da resposta', () => {
    facade.matricularAluno = vi.fn(() => throwError(() => ({ status: 500, error: 'boom' })));
    montar();
    const componente = fixture.componentInstance as unknown as {
      matricular: (aluno: { id: number }) => void;
      alertaPainel: () => { texto: string };
    };

    componente.matricular({ id: 2 });

    expect(componente.alertaPainel().texto).toBe('MENSAGEM.ERRO_MATRICULA');
  });

  it('recusa 422 com codigo e params interpola os dois valores distintos no DOM do alerta do painel', () => {
    facade.matricularAluno = vi.fn(() =>
      throwError(() => ({
        status: 422,
        error: {
          codigo: 'TURMA_CAPACIDADE_ATINGIDA',
          params: { capacidade: 22, alunosAtivos: 18 },
          mensagem: 'A turma atingiu a capacidade máxima.',
        },
      })),
    );
    montar();
    const componente = fixture.componentInstance as unknown as {
      matricular: (aluno: { id: number }) => void;
    };

    componente.matricular({ id: 2 });
    fixture.detectChanges();

    const texto = dom().querySelector('.caixa-mensagem')?.textContent ?? '';
    expect(texto).toContain('Capacidade: 22');
    expect(texto).toContain('alunos ativos: 18');
  });

  it('clicar em desligar não chama o facade antes da confirmação', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDaLinha: (evento: { acaoId: string; item: AlunoDaTurmaInterface }) => void;
    };

    componente.acaoDaLinha({ acaoId: 'desligar', item: criarAluno({ id: 5 }) });

    expect(facade.cancelarMatricula).not.toHaveBeenCalled();
  });

  it('confirmar despacha a ação pendente uma única vez com o item certo', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDaLinha: (evento: { acaoId: string; item: AlunoDaTurmaInterface }) => void;
      confirmar: () => void;
    };

    componente.acaoDaLinha({ acaoId: 'desligar', item: criarAluno({ id: 5 }) });
    componente.confirmar();

    expect(facade.cancelarMatricula).toHaveBeenCalledTimes(1);
    expect(facade.cancelarMatricula).toHaveBeenCalledWith(TURMA.id, 5);
  });

  it('cancelar a confirmação não chama o facade', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDaLinha: (evento: { acaoId: string; item: AlunoDaTurmaInterface }) => void;
      cancelarAcaoPendente: () => void;
    };

    componente.acaoDaLinha({ acaoId: 'desligar', item: criarAluno({ id: 5 }) });
    componente.cancelarAcaoPendente();

    expect(facade.cancelarMatricula).not.toHaveBeenCalled();
  });

  it('a ação de desligar cancela a matrícula do aluno confirmado', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDaLinha: (evento: { acaoId: string; item: AlunoDaTurmaInterface }) => void;
      confirmar: () => void;
    };

    componente.acaoDaLinha({ acaoId: 'desligar', item: criarAluno({ id: 5 }) });
    componente.confirmar();

    expect(facade.cancelarMatricula).toHaveBeenCalledWith(TURMA.id, 5);
  });

  it('desligar deixa a ação em voo, desabilitando só a linha do aluno confirmado', () => {
    const chamada$ = new Subject<void>();
    facade.cancelarMatricula = vi.fn(() => chamada$.asObservable());
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDaLinha: (evento: { acaoId: string; item: AlunoDaTurmaInterface }) => void;
      confirmar: () => void;
      acoesAlunoVisiveis: {
        id: string;
        desabilitada?: (item: AlunoDaTurmaInterface) => boolean;
      }[];
    };

    componente.acaoDaLinha({ acaoId: 'desligar', item: criarAluno({ id: 5 }) });
    componente.confirmar();

    const desligar = componente.acoesAlunoVisiveis.find((acao) => acao.id === 'desligar');

    expect(desligar?.desabilitada?.(criarAluno({ id: 5 }))).toBe(true);
    expect(desligar?.desabilitada?.(criarAluno({ id: 9 }))).toBe(false);

    chamada$.next();
    chamada$.complete();
  });

  it('erro ao desligar libera a linha para nova tentativa', () => {
    const chamada$ = new Subject<void>();
    facade.cancelarMatricula = vi.fn(() => chamada$.asObservable());
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDaLinha: (evento: { acaoId: string; item: AlunoDaTurmaInterface }) => void;
      confirmar: () => void;
      acoesAlunoVisiveis: {
        id: string;
        desabilitada?: (item: AlunoDaTurmaInterface) => boolean;
      }[];
    };

    componente.acaoDaLinha({ acaoId: 'desligar', item: criarAluno({ id: 5 }) });
    componente.confirmar();

    const desligar = componente.acoesAlunoVisiveis.find((acao) => acao.id === 'desligar');
    expect(desligar?.desabilitada?.(criarAluno({ id: 5 }))).toBe(true);

    chamada$.error({ status: 500 });

    expect(desligar?.desabilitada?.(criarAluno({ id: 5 }))).toBe(false);
  });

  it('ação desconhecida não dispara nenhuma intenção', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDaLinha: (evento: { acaoId: string; item: AlunoDaTurmaInterface }) => void;
    };

    componente.acaoDaLinha({ acaoId: 'outra', item: criarAluno() });

    expect(facade.cancelarMatricula).not.toHaveBeenCalled();
  });

  it('o botão de desligar só aparece em linha com matrícula ativa', () => {
    facade.alunosDaTurma = vi.fn(() =>
      of({
        status: 'ok',
        itens: [
          criarAluno({ id: 1 }),
          criarAluno({ id: 2, situacao: SituacaoEnturmamentoEnum.CANCELADO }),
        ],
      }),
    );
    montar();

    const linhas = linhasDe('alunos');
    expect(linhas[0].querySelectorAll('button').length).toBe(1);
    expect(linhas[1].querySelectorAll('button').length).toBe(0);
  });

  it('fechar o alerta o esconde sem apagar o texto', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      matricular: (aluno: { id: number }) => void;
      ocultarAlerta: () => void;
      alertaPainel: () => { visivel: boolean; texto: string };
    };

    componente.matricular({ id: 2 });
    componente.ocultarAlerta();

    expect(componente.alertaPainel().visivel).toBe(false);
    expect(componente.alertaPainel().texto).toBe('MENSAGEM.SUCESSO_MATRICULA');
  });

  it('desalocar usa o identificador da disciplina, não o do docente', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDocente: (evento: { acaoId: string; item: DocenteSqlInterface }) => void;
      confirmar: () => void;
    };

    componente.acaoDocente({ acaoId: 'desalocar', item: DOCENTE });
    componente.confirmar();

    expect(facade.desvincularDisciplina).toHaveBeenCalledWith(TURMA.id, DOCENTE.disciplinaId);
    expect(facade.desvincularDisciplina).not.toHaveBeenCalledWith(TURMA.id, DOCENTE.id);
  });

  it('ação desconhecida na tabela de docentes não dispara intenção', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      acaoDocente: (evento: { acaoId: string; item: DocenteSqlInterface }) => void;
    };

    componente.acaoDocente({ acaoId: 'outra', item: DOCENTE });

    expect(facade.desvincularDisciplina).not.toHaveBeenCalled();
  });

  it('escolher um docente no seletor limpa o campo sem chamar o facade antes da confirmação', () => {
    docentesFacadeMock = of({ status: 'ok', itens: [DOCENTE, DOCENTE_HISTORIA] });
    montar();
    const componente = fixture.componentInstance as unknown as {
      docenteSelecionado: { setValue: (v: number | null) => void; value: number | null };
    };

    componente.docenteSelecionado.setValue(DOCENTE_HISTORIA.id);

    expect(componente.docenteSelecionado.value).toBeNull();
    expect(facade.vincularDocente).not.toHaveBeenCalled();
  });

  it('limpar o seletor não dispara alocação', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      docenteSelecionado: { setValue: (v: number | null) => void };
    };

    componente.docenteSelecionado.setValue(null);

    expect(facade.vincularDocente).not.toHaveBeenCalled();
  });

  it('alocar docente em disciplina sem alocação atual pede confirmação e só aloca ao confirmar', () => {
    docentesFacadeMock = of({ status: 'ok', itens: [DOCENTE, DOCENTE_HISTORIA] });
    montar();
    const componente = fixture.componentInstance as unknown as {
      docenteSelecionado: { setValue: (v: number | null) => void };
      confirmar: () => void;
    };

    componente.docenteSelecionado.setValue(DOCENTE_HISTORIA.id);

    expect(facade.vincularDocente).not.toHaveBeenCalled();

    componente.confirmar();

    expect(facade.vincularDocente).toHaveBeenCalledWith(TURMA.id, {
      docenteId: DOCENTE_HISTORIA.id,
    });
  });

  it('trocar o docente de uma disciplina já ocupada pede confirmação e só substitui ao confirmar', () => {
    docentesFacadeMock = of({ status: 'ok', itens: [DOCENTE, DOCENTE_2] });
    montar();
    const componente = fixture.componentInstance as unknown as {
      docenteSelecionado: { setValue: (v: number | null) => void };
      confirmar: () => void;
    };

    componente.docenteSelecionado.setValue(DOCENTE_2.id);

    expect(facade.vincularDocente).not.toHaveBeenCalled();

    componente.confirmar();

    expect(facade.vincularDocente).toHaveBeenCalledWith(TURMA.id, { docenteId: DOCENTE_2.id });
  });

  it('escolher o docente que já leciona a disciplina avisa sem chamar o facade', () => {
    montar();
    const componente = fixture.componentInstance as unknown as {
      docenteSelecionado: { setValue: (v: number | null) => void };
      confirmar: () => void;
      alertaPainel: () => {
        visivel: boolean;
        tipo: string;
        texto: string;
        params?: Record<string, unknown>;
      };
    };

    componente.docenteSelecionado.setValue(DOCENTE.id);

    expect(facade.vincularDocente).not.toHaveBeenCalled();
    expect(componente.alertaPainel()).toMatchObject({
      visivel: true,
      tipo: 'sucesso',
      texto: 'TURMA.MENSAGEM.DOCENTE_JA_ALOCADO',
      params: { disciplina: 'Matemática' },
    });

    componente.confirmar();

    expect(facade.vincularDocente).not.toHaveBeenCalled();
  });

  it('turma inativa esconde os QUATRO controles de alteração e explica o motivo', () => {
    montar({ ...TURMA, ativo: false });

    expect(dom().querySelector('app-autocomplete')).toBeNull();
    expect(dom().querySelector('app-form-field-select')).toBeNull();
    expect(linhasDe('alunos')[0].querySelectorAll('button').length).toBe(0);
    expect(linhasDe('docentes')[0].querySelectorAll('button').length).toBe(0);
    expect(dom().querySelector('[data-testid="aviso-somente-leitura"]')).not.toBeNull();
  });

  it('turma ativa mantém os quatro controles e não mostra o aviso', () => {
    montar();

    expect(dom().querySelector('app-autocomplete')).not.toBeNull();
    expect(dom().querySelector('app-form-field-select')).not.toBeNull();
    expect(linhasDe('alunos')[0].querySelectorAll('button').length).toBe(1);
    expect(linhasDe('docentes')[0].querySelectorAll('button').length).toBe(1);
    expect(dom().querySelector('[data-testid="aviso-somente-leitura"]')).toBeNull();
  });

  it('turma inativa continua exibindo as duas listas', () => {
    montar({ ...TURMA, ativo: false });

    expect(linhasDe('alunos').length).toBe(1);
    expect(linhasDe('docentes').length).toBe(1);
  });

  it('falha ao carregar alunos não derruba a tabela de docentes', () => {
    facade.alunosDaTurma = vi.fn(() => of({ status: 'erro' }));
    montar();

    expect(textoDe('alunos')).toContain('Erro ao carregar alunos');
    expect(linhasDe('docentes').length).toBe(1);
  });

  it('bloco vazio anuncia a ausência em vez de renderizar tabela', () => {
    facade.docentesDaTurma = vi.fn(() => of({ status: 'ok', itens: [] }));
    montar();

    expect(textoDe('docentes')).toContain('Sem docentes');
    expect(linhasDe('docentes').length).toBe(0);
  });

  it('falha ao carregar a lista de docentes esconde o seletor e explica o motivo', () => {
    docentesFacadeMock = of({ status: 'erro' });
    montar();

    expect(textoDe('docentes')).toContain('Erro ao carregar a lista de docentes');
    expect(dom().querySelector('select')).toBeNull();
  });

  it('lista de docentes com dois itens renderiza um único select com o placeholder mais as duas opções', () => {
    docentesFacadeMock = of({ status: 'ok', itens: [DOCENTE, DOCENTE_2] });
    montar();

    const selects = dom().querySelectorAll('select');

    expect(selects.length).toBe(1);
    expect(selects[0].querySelectorAll('option').length).toBe(3);
  });

  it('dois docentes da mesma disciplina trazem o nome da disciplina e do docente no rótulo da opção', () => {
    docentesFacadeMock = of({ status: 'ok', itens: [DOCENTE, DOCENTE_2] });
    montar();

    const rotulos = Array.from(dom().querySelectorAll('select option')).map((opcao) =>
      opcao.textContent?.trim(),
    );

    expect(rotulos).toContain(`${DOCENTE.disciplinaNome} - ${DOCENTE.docenteNome}`);
    expect(rotulos).toContain(`${DOCENTE_2.disciplinaNome} - ${DOCENTE_2.docenteNome}`);
  });
});
