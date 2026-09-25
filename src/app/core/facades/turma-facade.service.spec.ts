import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environments';
import { TurnoEnum } from '../../shared/enums/turno.enum';
import { TurmaEditarDTO } from '../../shared/interfaces/dto/turma-editar-dto.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { TurmaFacadeService } from './turma-facade.service';

const URL_TURMAS = `${environment.apiUrl}/turmas`;

const TURMA_MOCK: TurmaInterface = {
  id: 1,
  ativo: true,
  identificador: 'A',
  serie: 1,
  anoLetivo: 2026,
  turno: TurnoEnum.MATUTINO,
  capacidade: 30,
  totalAlunos: 10,
  totalDisciplinas: 5,
};

const PAGINA_COM_ITEM: ResultadoPaginado<TurmaInterface> = {
  itens: [TURMA_MOCK],
  paginaAtual: 1,
  totalPaginas: 2,
  totalResultados: 13,
  tamanhoPagina: 12,
};

const PAGINA_VAZIA: ResultadoPaginado<TurmaInterface> = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 12,
};

const FILTRO_NAO_PADRAO: FiltroListaInterface = {
  pesquisa: 'sala 12',
  anoLetivo: 2025,
  turno: TurnoEnum.VESPERTINO,
  ativo: true,
};

const FILTRO_NAO_PADRAO_ESPERADO = {
  tamanhoPagina: '12',
  pesquisa: 'sala 12',
  anoLetivo: '2025',
  turno: String(TurnoEnum.VESPERTINO),
  ativo: 'true',
};

const EDICAO: TurmaEditarDTO = {
  id: 9,
  identificador: 'B',
  serie: 2,
  anoLetivo: 2026,
  turno: TurnoEnum.MATUTINO,
  capacidade: 30,
};

describe('TurmaFacadeService: as três intenções de mutação', () => {
  let facade: TurmaFacadeService;
  let http: HttpTestingController;
  let inscricoes: Subscription;

  const filtroDaRequisicao = (params: HttpParams) => ({
    pagina: params.get('pagina'),
    tamanhoPagina: params.get('tamanhoPagina'),
    pesquisa: params.get('pesquisa'),
    anoLetivo: params.get('anoLetivo'),
    turno: params.get('turno'),
    ativo: params.get('ativo'),
  });

  const proximaBusca = (resultado: ResultadoPaginado<TurmaInterface> = PAGINA_COM_ITEM) => {
    vi.advanceTimersByTime(0);
    const requisicao = http.expectOne((r) => r.url === URL_TURMAS);
    const filtro = filtroDaRequisicao(requisicao.request.params);
    requisicao.flush(resultado);
    return filtro;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    inscricoes = new Subscription();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    facade = TestBed.inject(TurmaFacadeService);
    http = TestBed.inject(HttpTestingController);

    inscricoes.add(facade.estado$.subscribe());
    proximaBusca();
  });

  afterEach(() => {
    inscricoes.unsubscribe();
    http.verify();
    vi.useRealTimers();
  });

  it('editar repassa o DTO ao service via PUT', () => {
    inscricoes.add(facade.editar(EDICAO).subscribe());

    const requisicao = http.expectOne(`${URL_TURMAS}/${EDICAO.id}`);
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual(EDICAO);
    requisicao.flush(null);
  });

  it('inativar repassa o id ao service via PATCH', () => {
    inscricoes.add(facade.inativar(5).subscribe());

    const requisicao = http.expectOne(`${URL_TURMAS}/5/inativar`);
    expect(requisicao.request.method).toBe('PATCH');
    requisicao.flush(null);
  });

  it('reativar repassa o id ao service via PATCH', () => {
    inscricoes.add(facade.reativar(5).subscribe());

    const requisicao = http.expectOne(`${URL_TURMAS}/5/reativar`);
    expect(requisicao.request.method).toBe('PATCH');
    requisicao.flush(null);
  });

  it('a página é preservada: editar na página 3 recarrega a página 3 com o filtro inteiro, não só a página', () => {
    facade.aplicarFiltros(FILTRO_NAO_PADRAO);
    facade.mudarPagina(3);
    expect(proximaBusca()).toEqual({ pagina: '3', ...FILTRO_NAO_PADRAO_ESPERADO });

    inscricoes.add(facade.editar(EDICAO).subscribe());
    http.expectOne(`${URL_TURMAS}/${EDICAO.id}`).flush(null);

    expect(proximaBusca()).toEqual({ pagina: '3', ...FILTRO_NAO_PADRAO_ESPERADO });
  });

  it('inativar na página 3 recarrega a página 3 com o filtro inteiro', () => {
    facade.aplicarFiltros(FILTRO_NAO_PADRAO);
    facade.mudarPagina(3);
    expect(proximaBusca()).toEqual({ pagina: '3', ...FILTRO_NAO_PADRAO_ESPERADO });

    inscricoes.add(facade.inativar(5).subscribe());
    http.expectOne(`${URL_TURMAS}/5/inativar`).flush(null);

    expect(proximaBusca()).toEqual({ pagina: '3', ...FILTRO_NAO_PADRAO_ESPERADO });
  });

  it('reativar na página 3 recarrega a página 3 com o filtro inteiro', () => {
    facade.aplicarFiltros(FILTRO_NAO_PADRAO);
    facade.mudarPagina(3);
    expect(proximaBusca()).toEqual({ pagina: '3', ...FILTRO_NAO_PADRAO_ESPERADO });

    inscricoes.add(facade.reativar(5).subscribe());
    http.expectOne(`${URL_TURMAS}/5/reativar`).flush(null);

    expect(proximaBusca()).toEqual({ pagina: '3', ...FILTRO_NAO_PADRAO_ESPERADO });
  });

  it('inativar que falha não recarrega a lista', () => {
    inscricoes.add(facade.inativar(5).subscribe({ error: () => undefined }));
    http
      .expectOne(`${URL_TURMAS}/5/inativar`)
      .flush('Turma não encontrada', { status: 404, statusText: 'Not Found' });

    vi.advanceTimersByTime(0);
    http.expectNone(URL_TURMAS);
  });

  it('resultado vazio com a página maior que 1 faz a busca seguinte pedir a página 1', () => {
    facade.mudarPagina(2);
    expect(proximaBusca(PAGINA_VAZIA).pagina).toBe('2');

    expect(proximaBusca().pagina).toBe('1');
  });

  it('alunosDaTurma emite carregando e depois ok com os itens da resposta', () => {
    const emitidos: string[] = [];
    inscricoes.add(facade.alunosDaTurma(7).subscribe((estado) => emitidos.push(estado.status)));

    http.expectOne(`${URL_TURMAS}/7/alunos`).flush([{ id: 1, matricula: '2026001', nome: 'Ana' }]);

    expect(emitidos).toEqual(['carregando', 'ok']);
  });

  it('docentesDaTurma emite carregando e depois ok com os itens da resposta', () => {
    const emitidos: string[] = [];
    inscricoes.add(facade.docentesDaTurma(7).subscribe((estado) => emitidos.push(estado.status)));

    http.expectOne(`${URL_TURMAS}/7/docentes`).flush([]);

    expect(emitidos).toEqual(['carregando', 'ok']);
  });

  it('docentesDaTurma converte a falha em estado de erro', () => {
    const emitidos: string[] = [];
    inscricoes.add(facade.docentesDaTurma(7).subscribe((estado) => emitidos.push(estado.status)));

    http
      .expectOne(`${URL_TURMAS}/7/docentes`)
      .flush('falhou', { status: 500, statusText: 'Server Error' });

    expect(emitidos).toEqual(['carregando', 'erro']);
  });

  it('matricularAluno envia o DTO via POST e recarrega a lista de fundo', () => {
    inscricoes.add(facade.matricularAluno(7, { alunoId: 2 }).subscribe());

    const requisicao = http.expectOne(`${URL_TURMAS}/7/alunos`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ alunoId: 2 });
    requisicao.flush(null);

    expect(proximaBusca().pagina).toBe('1');
  });

  it('cancelarMatricula usa PATCH na rota do aluno e recarrega a lista de fundo', () => {
    inscricoes.add(facade.cancelarMatricula(7, 5).subscribe());

    const requisicao = http.expectOne(`${URL_TURMAS}/7/alunos/5/cancelar`);
    expect(requisicao.request.method).toBe('PATCH');
    requisicao.flush(null);

    expect(proximaBusca().pagina).toBe('1');
  });

  it('a mutação reemite as cargas do painel, que refazem a requisição', () => {
    const emitidos: string[] = [];
    inscricoes.add(facade.alunosDaTurma(7).subscribe((estado) => emitidos.push(estado.status)));
    http.expectOne(`${URL_TURMAS}/7/alunos`).flush([]);

    inscricoes.add(facade.cancelarMatricula(7, 5).subscribe());
    http.expectOne(`${URL_TURMAS}/7/alunos/5/cancelar`).flush(null);

    http.expectOne(`${URL_TURMAS}/7/alunos`).flush([]);
    expect(emitidos).toEqual(['carregando', 'ok', 'carregando', 'ok']);
    proximaBusca();
  });

  it('vincularDocente envia o DTO via POST na rota de docentes da turma', () => {
    inscricoes.add(facade.vincularDocente(7, { docenteId: 4 }).subscribe());

    const requisicao = http.expectOne(`${URL_TURMAS}/7/docentes`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ docenteId: 4 });
    requisicao.flush(null);

    expect(proximaBusca().pagina).toBe('1');
  });

  it('desvincularDisciplina usa DELETE na rota da disciplina', () => {
    inscricoes.add(facade.desvincularDisciplina(7, 11).subscribe());

    const requisicao = http.expectOne(`${URL_TURMAS}/7/disciplinas/11`);
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null);

    expect(proximaBusca().pagina).toBe('1');
  });

  it('alunosDisponiveis repassa a lista do servidor sem envelope de estado', () => {
    const recebidos: unknown[] = [];
    inscricoes.add(facade.alunosDisponiveis(7).subscribe((lista) => recebidos.push(lista)));

    http
      .expectOne(`${URL_TURMAS}/7/alunos-disponiveis`)
      .flush([{ id: 2, matricula: '2026002', nome: 'Bruno' }]);

    expect(recebidos).toEqual([[{ id: 2, matricula: '2026002', nome: 'Bruno' }]]);
  });

  it('alunosDaTurma converte a falha em estado de erro, sem derrubar o fluxo', () => {
    const emitidos: string[] = [];
    inscricoes.add(facade.alunosDaTurma(7).subscribe((estado) => emitidos.push(estado.status)));

    http
      .expectOne(`${URL_TURMAS}/7/alunos`)
      .flush('falhou', { status: 500, statusText: 'Server Error' });

    expect(emitidos).toEqual(['carregando', 'erro']);
  });
});
