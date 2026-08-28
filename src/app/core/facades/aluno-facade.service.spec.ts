import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, Subscription } from 'rxjs';
import { environment } from '../../../environments/environments';
import { DirecaoOrdenacaoEnum } from '../../shared/enums/direcao-ordenacao.enum';
import { OrdenacaoAlunoEnum } from '../../shared/enums/ordenacao-aluno.enum';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { AlunoFiltro } from '../../shared/interfaces/ui/aluno-filtro.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { AlunoFacadeService } from './aluno-facade.service';
import { AuthFacadeService } from './auth-facade.service';

const URL_BUSCA = `${environment.apiUrl}/alunos/buscar`;
const URL_INATIVAR = (id: number) => `${environment.apiUrl}/alunos/${id}/inativar`;

const PAGINA_VAZIA: ResultadoPaginado<AlunoInterface> = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

describe('AlunoFacadeService', () => {
  let facade: AlunoFacadeService;
  let http: HttpTestingController;
  let inscricoes: Subscription;

  /**
   * `resultado$` tem debounceTime(0): a requisição só sai no próximo tick.
   * Sem adiantar o relógio, expectOne não acha nada. Devolve o corpo enviado,
   * que é como se lê o estado atual do Facade de fora.
   */
  const proximaBusca = (): AlunoFiltro => {
    vi.advanceTimersByTime(0);
    const requisicao = http.expectOne(URL_BUSCA);
    const filtro = requisicao.request.body as AlunoFiltro;
    requisicao.flush(PAGINA_VAZIA);
    return filtro;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacadeService, useValue: { estaLogado$: of(true) } },
      ],
    });
    facade = TestBed.inject(AlunoFacadeService);
    http = TestBed.inject(HttpTestingController);

    inscricoes = new Subscription();
    inscricoes.add(facade.resultado$.subscribe());
    proximaBusca();
  });

  afterEach(() => {
    inscricoes.unsubscribe();
    http.verify();
    vi.useRealTimers();
  });

  describe('aplicarFiltros', () => {
    it('leva o filtro adiante e volta para a primeira página', () => {
      facade.mudarPagina(4);
      proximaBusca();

      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);

      const filtro = proximaBusca();
      expect(filtro.pesquisa).toBe('ana');
      expect(filtro.pagina).toBe(1);
    });
  });

  describe('mudarPagina', () => {
    it('troca a página sem perder os outros filtros', () => {
      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
      proximaBusca();

      facade.mudarPagina(3);

      const filtro = proximaBusca();
      expect(filtro.pagina).toBe(3);
      expect(filtro.pesquisa).toBe('ana');
    });
  });

  describe('ordenarPor — o ciclo de três estados', () => {
    it('primeiro clique ordena ascendente', () => {
      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);

      const filtro = proximaBusca();
      expect(filtro.ordenacao).toBe(OrdenacaoAlunoEnum.NOME);
      expect(filtro.direcao).toBe(DirecaoOrdenacaoEnum.ASC);
    });

    it('segundo clique no mesmo campo inverte para descendente', () => {
      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);
      proximaBusca();

      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);

      expect(proximaBusca().direcao).toBe(DirecaoOrdenacaoEnum.DESC);
    });

    it('terceiro clique zera a ordenação em vez de voltar a ascendente', () => {
      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);
      proximaBusca();
      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);
      proximaBusca();

      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);

      const filtro = proximaBusca();
      expect(filtro.ordenacao).toBeNull();
      expect(filtro.direcao).toBeNull();
    });

    it('trocar de campo recomeça o ciclo em ascendente', () => {
      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);
      proximaBusca();
      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);
      proximaBusca();

      facade.ordenarPor(OrdenacaoAlunoEnum.MATRICULA);

      const filtro = proximaBusca();
      expect(filtro.ordenacao).toBe(OrdenacaoAlunoEnum.MATRICULA);
      expect(filtro.direcao).toBe(DirecaoOrdenacaoEnum.ASC);
    });
  });

  describe('mutação recarrega a lista', () => {
    it('inativar dispara nova busca com o filtro vigente', () => {
      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
      proximaBusca();

      inscricoes.add(facade.inativar(7).subscribe());
      http.expectOne(URL_INATIVAR(7)).flush(null);

      expect(proximaBusca().pesquisa).toBe('ana');
    });
  });
});
