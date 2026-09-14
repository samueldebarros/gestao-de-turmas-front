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
});
