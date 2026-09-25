import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environments';
import { DirecaoOrdenacaoEnum } from '../../shared/enums/direcao-ordenacao.enum';
import { OrdenacaoDocenteEnum } from '../../shared/enums/ordenacao-docente.enum';
import { DocenteAdicionarDTO } from '../../shared/interfaces/dto/docente-adicionar-dto.interface';
import { DocenteEditarDTO } from '../../shared/interfaces/dto/docente-editar-dto.interface';
import { DocenteDetalheInterface } from '../../shared/interfaces/entities/docente-detalhe.interface';
import { DocenteListaInterface } from '../../shared/interfaces/entities/docente-lista.interface';
import { DocenteSqlInterface } from '../../shared/interfaces/entities/docente-sql.interface';
import { SEM_DISCIPLINA, TODAS_DISCIPLINAS } from '../../shared/constants/disciplina-filtro.const';
import { DocenteFiltro } from '../../shared/interfaces/ui/docente-filtro.interface';
import { EstadoCarga } from '../../shared/interfaces/ui/estado-carga.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { DocenteFacadeService } from './docente-facade.service';

const URL_ESPERADA = `${environment.apiUrl}/docentes`;
const URL_BUSCA = `${URL_ESPERADA}/buscar`;

const PAGINA_VAZIA: ResultadoPaginado<DocenteListaInterface> = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

const DETALHE: DocenteDetalheInterface = {
  id: 16,
  nome: 'Teste Docente Sem Disciplina',
  email: 'teste.semdisc@email.com',
  dataNascimento: '1985-11-22',
  disciplinaId: null,
  ativo: true,
};

const NOVO_DOCENTE: DocenteAdicionarDTO = {
  nome: 'Docente Novo',
  cpf: '111.222.333-96',
  email: 'novo@escola.br',
  dataNascimento: '1990-05-10',
  disciplinaId: 2,
};

const EDICAO: DocenteEditarDTO = {
  id: 15,
  nome: 'Docente Editado',
  email: 'editado@escola.br',
  dataNascimento: '1991-06-11',
  disciplinaId: 5,
};

const DOCENTES: DocenteSqlInterface[] = [
  {
    id: 1,
    docenteNome: 'Ana',
    docenteEmail: 'ana@escola.br',
    disciplinaId: 11,
    disciplinaNome: 'Matemática',
    cargaHoraria: 40,
  },
];

describe('DocenteFacadeService', () => {
  let facade: DocenteFacadeService;
  let http: HttpTestingController;
  let inscricoes: Subscription;

  beforeEach(() => {
    inscricoes = new Subscription();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    facade = TestBed.inject(DocenteFacadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    inscricoes.unsubscribe();
    http.verify();
  });

  describe('docentes$: o contrato do shareReplay', () => {
    it('dois assinantes simultâneos disparam uma requisição, não duas', () => {
      inscricoes.add(facade.docentes$.subscribe());
      inscricoes.add(facade.docentes$.subscribe());

      http.expectOne(URL_ESPERADA).flush(DOCENTES);
    });

    it('assinante que chega depois recebe o valor guardado, sem nova requisição', () => {
      inscricoes.add(facade.docentes$.subscribe());
      http.expectOne(URL_ESPERADA).flush(DOCENTES);

      let recebido: EstadoCarga<DocenteSqlInterface> | undefined;
      inscricoes.add(facade.docentes$.subscribe((estado) => (recebido = estado)));

      expect(recebido).toEqual({ status: 'ok', itens: DOCENTES });
      http.expectNone(URL_ESPERADA);
    });

    it('caracterização: não refaz a busca depois que a fonte completou, mesmo sem assinante vivo', () => {
      const primeira = facade.docentes$.subscribe();
      http.expectOne(URL_ESPERADA).flush(DOCENTES);
      primeira.unsubscribe();

      let recebido: EstadoCarga<DocenteSqlInterface> | undefined;
      inscricoes.add(facade.docentes$.subscribe((estado) => (recebido = estado)));

      expect(recebido).toEqual({ status: 'ok', itens: DOCENTES });
      http.expectNone(URL_ESPERADA);
    });

    it('quando a fonte falha, emite o estado de erro em vez de propagar a exceção', () => {
      const estados: EstadoCarga<DocenteSqlInterface>[] = [];
      inscricoes.add(facade.docentes$.subscribe((estado) => estados.push(estado)));

      http
        .expectOne(URL_ESPERADA)
        .flush('falha', { status: 500, statusText: 'Internal Server Error' });

      expect(estados).toEqual([{ status: 'carregando' }, { status: 'erro' }]);
    });

    it('depois de uma falha, uma nova assinatura refaz a busca em vez de repetir o erro para sempre', () => {
      const primeira = facade.docentes$.subscribe();
      http
        .expectOne(URL_ESPERADA)
        .flush('falha', { status: 500, statusText: 'Internal Server Error' });
      primeira.unsubscribe();

      let recebido: EstadoCarga<DocenteSqlInterface> | undefined;
      inscricoes.add(facade.docentes$.subscribe((estado) => (recebido = estado)));
      http.expectOne(URL_ESPERADA).flush(DOCENTES);

      expect(recebido).toEqual({ status: 'ok', itens: DOCENTES });
    });
  });

  describe('resultado$: o estado paginado', () => {
    const proximaBusca = (): DocenteFiltro => {
      vi.advanceTimersByTime(0);
      const requisicao = http.expectOne(URL_BUSCA);
      const filtro = requisicao.request.body as DocenteFiltro;
      requisicao.flush(PAGINA_VAZIA);
      return filtro;
    };

    let filtroInicial: DocenteFiltro;

    beforeEach(() => {
      vi.useFakeTimers();
      inscricoes.add(facade.resultado$.subscribe());
      filtroInicial = proximaBusca();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('parte do filtro padrão: página 1, 10 por página, todos os status', () => {
      facade.mudarPagina(2);

      const filtro = proximaBusca();
      expect(filtro.tamanhoPagina).toBe(10);
      expect(filtro.ativo).toBeNull();
    });

    it('CA-7: a primeira busca (filtro padrão) leva disciplinaId nulo', () => {
      expect(filtroInicial.disciplinaId).toBeNull();
    });

    it('aplicarFiltros leva o termo adiante e volta para a primeira página', () => {
      facade.mudarPagina(4);
      proximaBusca();

      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);

      const filtro = proximaBusca();
      expect(filtro.pesquisa).toBe('ana');
      expect(filtro.pagina).toBe(1);
    });

    it('CA-8: aplicarFiltros traduz disciplinaId e reseta a página, preservando a pesquisa', () => {
      facade.mudarPagina(4);
      proximaBusca();

      facade.aplicarFiltros({ pesquisa: 'x', disciplinaId: 3 } as FiltroListaInterface);

      const filtro = proximaBusca();
      expect(filtro.disciplinaId).toBe(3);
      expect(filtro.pagina).toBe(1);
      expect(filtro.pesquisa).toBe('x');
    });

    it('aplicarFiltros com SEM_DISCIPLINA (0) leva disciplinaId 0, nunca null', () => {
      facade.aplicarFiltros({
        pesquisa: '',
        disciplinaId: SEM_DISCIPLINA,
      } as FiltroListaInterface);

      const filtro = proximaBusca();
      expect(filtro.disciplinaId).toBe(0);
      expect(filtro.disciplinaId).not.toBeNull();
    });

    it('CA-9: aplicarFiltros converte a sentinela TODAS_DISCIPLINAS em null, nunca -1', () => {
      facade.aplicarFiltros({
        pesquisa: '',
        disciplinaId: TODAS_DISCIPLINAS,
      } as FiltroListaInterface);

      const filtro = proximaBusca();
      expect(filtro.disciplinaId).toBeNull();
      expect(filtro.disciplinaId).not.toBe(-1);
    });

    it('mudarPagina troca a página sem perder filtro nem ordenação', () => {
      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
      proximaBusca();
      facade.ordenarPor(OrdenacaoDocenteEnum.DISCIPLINA);
      proximaBusca();

      facade.mudarPagina(3);

      const filtro = proximaBusca();
      expect(filtro.pagina).toBe(3);
      expect(filtro.pesquisa).toBe('ana');
      expect(filtro.ordenacao).toBe(OrdenacaoDocenteEnum.DISCIPLINA);
    });

    describe('ordenarPor e o ciclo de três estados', () => {
      it('primeiro clique ordena ascendente', () => {
        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);

        const filtro = proximaBusca();
        expect(filtro.ordenacao).toBe(OrdenacaoDocenteEnum.NOME);
        expect(filtro.direcao).toBe(DirecaoOrdenacaoEnum.ASC);
      });

      it('segundo clique no mesmo campo inverte para descendente', () => {
        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);
        proximaBusca();

        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);

        expect(proximaBusca().direcao).toBe(DirecaoOrdenacaoEnum.DESC);
      });

      it('terceiro clique zera a ordenação em vez de voltar a ascendente', () => {
        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);
        proximaBusca();
        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);
        proximaBusca();

        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);

        const filtro = proximaBusca();
        expect(filtro.ordenacao).toBeNull();
        expect(filtro.direcao).toBeNull();
      });

      it('trocar de campo recomeça o ciclo em ascendente', () => {
        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);
        proximaBusca();
        facade.ordenarPor(OrdenacaoDocenteEnum.NOME);
        proximaBusca();

        facade.ordenarPor(OrdenacaoDocenteEnum.DISCIPLINA);

        const filtro = proximaBusca();
        expect(filtro.ordenacao).toBe(OrdenacaoDocenteEnum.DISCIPLINA);
        expect(filtro.direcao).toBe(DirecaoOrdenacaoEnum.ASC);
      });
    });

    describe('mutação recarrega a lista', () => {
      it.each([
        { acao: 'inativar', sufixo: 'inativar' },
        { acao: 'reativar', sufixo: 'reativar' },
      ] as const)('$acao dispara nova busca com o filtro vigente', ({ acao, sufixo }) => {
        facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
        proximaBusca();

        inscricoes.add(facade[acao](7).subscribe());
        http
          .expectOne(`${URL_ESPERADA}/7/${sufixo}`)
          .flush(null, { status: 204, statusText: 'No Content' });

        expect(proximaBusca().pesquisa).toBe('ana');
      });

      it('adicionar dispara nova busca com o filtro vigente', () => {
        facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
        proximaBusca();

        inscricoes.add(facade.adicionar(NOVO_DOCENTE).subscribe());
        http
          .expectOne({ method: 'POST', url: URL_ESPERADA })
          .flush(null, { status: 201, statusText: 'Created' });

        expect(proximaBusca().pesquisa).toBe('ana');
      });

      it('editar dispara nova busca com o filtro vigente', () => {
        facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
        proximaBusca();

        inscricoes.add(facade.editar(EDICAO).subscribe());
        http
          .expectOne({ method: 'PUT', url: `${URL_ESPERADA}/${EDICAO.id}` })
          .flush(null, { status: 204, statusText: 'No Content' });

        expect(proximaBusca().pesquisa).toBe('ana');
      });

      it('mutação que falha não recarrega a lista', () => {
        inscricoes.add(facade.adicionar(NOVO_DOCENTE).subscribe({ error: () => undefined }));
        http
          .expectOne({ method: 'POST', url: URL_ESPERADA })
          .flush('CPF já cadastrado', { status: 422, statusText: 'Unprocessable Entity' });

        vi.advanceTimersByTime(0);
        http.expectNone(URL_BUSCA);
      });
    });

    describe('carregarDetalhe é leitura, não mutação', () => {
      it('busca o detalhe no endpoint por id', () => {
        let recebido: DocenteDetalheInterface | undefined;
        inscricoes.add(facade.carregarDetalhe(16).subscribe((d) => (recebido = d)));

        http.expectOne(`${URL_ESPERADA}/16`).flush(DETALHE);

        expect(recebido).toEqual(DETALHE);
      });

      it('não re-emite o filtro: clicar em Editar não recarrega a lista', () => {
        inscricoes.add(facade.carregarDetalhe(16).subscribe());
        http.expectOne(`${URL_ESPERADA}/16`).flush(DETALHE);

        vi.advanceTimersByTime(0);
        http.expectNone(URL_BUSCA);
      });
    });
  });

  describe('as duas leituras convivem', () => {
    it('docentes$ e resultado$ batem em endpoints diferentes', () => {
      vi.useFakeTimers();

      inscricoes.add(facade.docentes$.subscribe());
      inscricoes.add(facade.resultado$.subscribe());
      vi.advanceTimersByTime(0);

      http.expectOne(URL_ESPERADA).flush(DOCENTES);
      http.expectOne(URL_BUSCA).flush(PAGINA_VAZIA);

      vi.useRealTimers();
    });
  });
});
