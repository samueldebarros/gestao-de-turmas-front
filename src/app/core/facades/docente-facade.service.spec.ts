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
import { DocenteFiltro } from '../../shared/interfaces/ui/docente-filtro.interface';
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
    disciplinaNome: 'Matemática',
    cargaHoraria: 40,
  },
];

describe('DocenteFacadeService', () => {
  let facade: DocenteFacadeService;
  let http: HttpTestingController;
  let inscricoes: Subscription;

  beforeEach(() => {
    // Precisa ser recriado a cada teste: Subscription fechada nunca reabre, e
    // todo add() posterior cancelaria a assinatura na hora, sem disparar HTTP.
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

  describe('docentes$ — o contrato do shareReplay', () => {
    it('dois assinantes simultâneos disparam UMA requisição, não duas', () => {
      inscricoes.add(facade.docentes$.subscribe());
      inscricoes.add(facade.docentes$.subscribe());

      http.expectOne(URL_ESPERADA).flush(DOCENTES);
    });

    it('assinante que chega depois recebe o valor guardado, sem nova requisição', () => {
      inscricoes.add(facade.docentes$.subscribe());
      http.expectOne(URL_ESPERADA).flush(DOCENTES);

      let recebido: DocenteSqlInterface[] | undefined;
      inscricoes.add(facade.docentes$.subscribe((docentes) => (recebido = docentes)));

      expect(recebido).toEqual(DOCENTES);
      http.expectNone(URL_ESPERADA);
    });

    // ⚠️ Contra-intuitivo, e é o ponto deste teste: `refCount: true` NAO refaz a
    // busca aqui. Ele so descarta a fonte quando ela ainda esta em voo; requisicao
    // HTTP completa depois de emitir, entao o valor fica cacheado pelo resto da
    // vida da aplicacao. Consequencia real: esta lista nao atualiza sem recarregar
    // a pagina — o que basta para uma tela read-only e NAO basta quando houver
    // mutacao (inativar/reativar) mexendo nela.
    it('não refaz a busca depois que a fonte completou, mesmo sem assinante vivo', () => {
      const primeira = facade.docentes$.subscribe();
      http.expectOne(URL_ESPERADA).flush(DOCENTES);
      primeira.unsubscribe();

      let recebido: DocenteSqlInterface[] | undefined;
      inscricoes.add(facade.docentes$.subscribe((docentes) => (recebido = docentes)));

      expect(recebido).toEqual(DOCENTES);
      http.expectNone(URL_ESPERADA);
    });
  });

  describe('resultado$ — o estado paginado', () => {
    const proximaBusca = (): DocenteFiltro => {
      vi.advanceTimersByTime(0);
      const requisicao = http.expectOne(URL_BUSCA);
      const filtro = requisicao.request.body as DocenteFiltro;
      requisicao.flush(PAGINA_VAZIA);
      return filtro;
    };

    beforeEach(() => {
      vi.useFakeTimers();
      inscricoes.add(facade.resultado$.subscribe());
      proximaBusca();
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

    it('aplicarFiltros leva o termo adiante e volta para a primeira página', () => {
      facade.mudarPagina(4);
      proximaBusca();

      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);

      const filtro = proximaBusca();
      expect(filtro.pesquisa).toBe('ana');
      expect(filtro.pagina).toBe(1);
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

    describe('ordenarPor — o ciclo de três estados', () => {
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

      // O `aposMutacao()` vive dentro de um `tap`, que nao roda no caminho de erro.
      // Recarregar depois de falhar seria pior do que inutil: apagaria da tela o
      // estado que o usuario precisa ver para entender que nada foi salvo.
      it('mutação que falha NÃO recarrega a lista', () => {
        inscricoes.add(facade.adicionar(NOVO_DOCENTE).subscribe({ error: () => undefined }));
        http
          .expectOne({ method: 'POST', url: URL_ESPERADA })
          .flush('CPF já cadastrado', { status: 422, statusText: 'Unprocessable Entity' });

        vi.advanceTimersByTime(0);
        http.expectNone(URL_BUSCA);
      });
    });

    describe('carregarDetalhe — leitura, não mutação', () => {
      it('busca o detalhe no endpoint por id', () => {
        let recebido: DocenteDetalheInterface | undefined;
        inscricoes.add(facade.carregarDetalhe(16).subscribe((d) => (recebido = d)));

        http.expectOne(`${URL_ESPERADA}/16`).flush(DETALHE);

        expect(recebido).toEqual(DETALHE);
      });

      // Abrir o modal de edicao e leitura. Se `carregarDetalhe` re-emitisse o
      // filtro, cada clique em Editar dispararia uma busca inteira da lista —
      // trafego e piscada de tela por nada.
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
