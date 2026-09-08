import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environments';
import { TurnoEnum } from '../../shared/enums/turno.enum';
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
