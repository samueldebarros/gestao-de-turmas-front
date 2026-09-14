import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environments';
import { TurnoEnum } from '../../shared/enums/turno.enum';
import { TurmaEditarDTO } from '../../shared/interfaces/dto/turma-editar-dto.interface';
import { TurmaFiltro } from '../../shared/interfaces/ui/turma-filtro.interface';
import { TurmaService } from './turma.service';

const URL_TURMAS = `${environment.apiUrl}/turmas`;

const criarFiltro = (parcial: Partial<TurmaFiltro> = {}): TurmaFiltro => ({
  pagina: 1,
  tamanhoPagina: 10,
  pesquisa: '',
  anoLetivo: null,
  turno: null,
  ativo: null,
  ...parcial,
});

const PAGINA_VAZIA = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

describe('TurmaService: a query string montada pelo montarParams', () => {
  let service: TurmaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TurmaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  const requisicaoDeTurmas = () => http.expectOne((requisicao) => requisicao.url === URL_TURMAS);

  it('descarta null, undefined e string vazia', () => {
    service.obterTurmas(criarFiltro({ pesquisa: '', anoLetivo: null, turno: null })).subscribe();

    const requisicao = requisicaoDeTurmas();
    expect(requisicao.request.params.has('pesquisa')).toBe(false);
    expect(requisicao.request.params.has('anoLetivo')).toBe(false);
    expect(requisicao.request.params.has('turno')).toBe(false);
    expect(requisicao.request.params.keys().sort()).toEqual(['pagina', 'tamanhoPagina']);
    requisicao.flush(PAGINA_VAZIA);
  });

  it('preserva ativo false, que um !valor desatento faria sumir em silêncio', () => {
    service.obterTurmas(criarFiltro({ ativo: false })).subscribe();

    const requisicao = requisicaoDeTurmas();
    expect(requisicao.request.params.has('ativo')).toBe(true);
    expect(requisicao.request.params.get('ativo')).toBe('false');
    requisicao.flush(PAGINA_VAZIA);
  });

  it('preserva o número zero, que também é falsy', () => {
    service.obterTurmas(criarFiltro({ anoLetivo: 0 })).subscribe();

    const requisicao = requisicaoDeTurmas();
    expect(requisicao.request.params.get('anoLetivo')).toBe('0');
    requisicao.flush(PAGINA_VAZIA);
  });

  it('serializa todo valor como string, inclusive enum numérico', () => {
    service.obterTurmas(criarFiltro({ turno: TurnoEnum.MATUTINO, pesquisa: '3A' })).subscribe();

    const requisicao = requisicaoDeTurmas();
    expect(requisicao.request.params.get('turno')).toBe(String(TurnoEnum.MATUTINO));
    expect(requisicao.request.params.get('pesquisa')).toBe('3A');
    requisicao.flush(PAGINA_VAZIA);
  });

  it('é GET: o filtro de turma vai na query string, ao contrário do de aluno', () => {
    service.obterTurmas(criarFiltro()).subscribe();

    const requisicao = requisicaoDeTurmas();
    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.body).toBeNull();
    requisicao.flush(PAGINA_VAZIA);
  });
});

describe('TurmaService: os três verbos novos', () => {
  let service: TurmaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TurmaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('editarTurma faz PUT em /turmas/{id} com o DTO no corpo, sem alocacoes, alunosIds ou ativo', () => {
    const dto: TurmaEditarDTO = {
      id: 7,
      identificador: 'A',
      serie: 2,
      anoLetivo: 2026,
      turno: TurnoEnum.NOTURNO,
      capacidade: 25,
    };

    service.editarTurma(dto).subscribe();

    const requisicao = http.expectOne(`${URL_TURMAS}/7`);
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual(dto);
    expect(requisicao.request.body).not.toHaveProperty('alocacoes');
    expect(requisicao.request.body).not.toHaveProperty('alunosIds');
    expect(requisicao.request.body).not.toHaveProperty('ativo');
    requisicao.flush(null);
  });

  it('inativarTurma faz PATCH em /turmas/{id}/inativar com corpo vazio', () => {
    service.inativarTurma(1).subscribe();

    const requisicao = http.expectOne(`${URL_TURMAS}/1/inativar`);
    expect(requisicao.request.method).toBe('PATCH');
    expect(requisicao.request.body).toEqual({});
    requisicao.flush(null);
  });

  it('reativarTurma faz PATCH em /turmas/{id}/reativar com corpo vazio', () => {
    service.reativarTurma(1).subscribe();

    const requisicao = http.expectOne(`${URL_TURMAS}/1/reativar`);
    expect(requisicao.request.method).toBe('PATCH');
    expect(requisicao.request.body).toEqual({});
    requisicao.flush(null);
  });
});
