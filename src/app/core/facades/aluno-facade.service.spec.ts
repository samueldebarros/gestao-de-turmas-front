import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { environment } from '../../../environments/environments';
import { DirecaoOrdenacaoEnum } from '../../shared/enums/direcao-ordenacao.enum';
import { OrdenacaoAlunoEnum } from '../../shared/enums/ordenacao-aluno.enum';
import { SexoEnum } from '../../shared/enums/sexo.enum';
import { AlunoAdicionarDTO } from '../../shared/interfaces/dto/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/dto/aluno-editar-dto.interface';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { AlunoFiltro } from '../../shared/interfaces/ui/aluno-filtro.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { OrdenacaoTabela } from '../../shared/interfaces/ui/ordenaca-tabela.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { AlunoFacadeService } from './aluno-facade.service';
import { AuthFacadeService } from './auth-facade.service';

const URL_ALUNOS = `${environment.apiUrl}/alunos`;
const URL_BUSCA = `${URL_ALUNOS}/buscar`;
const URL_IMPORTAR = `${URL_ALUNOS}/importar`;
const URL_INATIVAR = (id: number) => `${URL_ALUNOS}/${id}/inativar`;
const URL_REATIVAR = (id: number) => `${URL_ALUNOS}/${id}/reativar`;
const URL_EDITAR = (id: number) => `${URL_ALUNOS}/${id}`;

const PAGINA_VAZIA: ResultadoPaginado<AlunoInterface> = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

const criarPaginaCom = (...nomes: string[]): ResultadoPaginado<AlunoInterface> => ({
  ...PAGINA_VAZIA,
  itens: nomes.map((nome, indice) => ({
    id: indice + 1,
    matricula: `202600${indice + 1}`,
    nome,
    cpf: '529.***.***-25',
    email: `${nome.toLowerCase()}@escola.com`,
    sexo: SexoEnum.FEMININO,
    dataNascimento: new Date('2008-03-12'),
    ativo: true,
  })),
  totalResultados: nomes.length,
});

const criarDtoAdicionar = (): AlunoAdicionarDTO => ({
  nome: 'Ana Souza',
  dataNascimento: '2008-03-12',
  cpf: '52998224725',
  sexo: SexoEnum.FEMININO,
  email: 'ana.souza@escola.com',
});

const criarDtoEditar = (): AlunoEditarDTO => ({
  id: 7,
  nome: 'Ana Souza Lima',
  dataNascimento: '2008-03-12',
  sexo: SexoEnum.FEMININO,
  email: 'ana.lima@escola.com',
});

describe('AlunoFacadeService', () => {
  let facade: AlunoFacadeService;
  let http: HttpTestingController;
  let inscricoes: Subscription;
  let estaLogado$: BehaviorSubject<boolean>;

  const proximaBusca = (): AlunoFiltro => {
    vi.advanceTimersByTime(0);
    const requisicao = http.expectOne(URL_BUSCA);
    const filtro = requisicao.request.body as AlunoFiltro;
    requisicao.flush(PAGINA_VAZIA);
    return filtro;
  };

  const coletarSugestoes = (termo: string): AlunoInterface[][] => {
    const emitidas: AlunoInterface[][] = [];
    inscricoes.add(facade.buscarSugestoes(termo).subscribe((itens) => emitidas.push(itens)));
    return emitidas;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    estaLogado$ = new BehaviorSubject<boolean>(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacadeService, useValue: { estaLogado$ } },
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

  describe('ordenarPor e o ciclo de três estados', () => {
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

    it('adicionar dispara o POST e, em seguida, uma nova busca com o filtro vigente', () => {
      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
      proximaBusca();
      const dto = criarDtoAdicionar();

      inscricoes.add(facade.adicionar(dto).subscribe());

      const criacao = http.expectOne(URL_ALUNOS);
      expect(criacao.request.method).toBe('POST');
      expect(criacao.request.body).toEqual(dto);
      criacao.flush(null);
      expect(proximaBusca().pesquisa).toBe('ana');
    });

    const MUTACOES: {
      acao: string;
      url: string;
      chamar: (alvo: AlunoFacadeService) => Observable<unknown>;
      resposta: Record<string, unknown> | null;
    }[] = [
      {
        acao: 'editar',
        url: URL_EDITAR(7),
        chamar: (alvo) => alvo.editar(criarDtoEditar()),
        resposta: null,
      },
      {
        acao: 'reativar',
        url: URL_REATIVAR(7),
        chamar: (alvo) => alvo.reativar(7),
        resposta: null,
      },
      {
        acao: 'importarAlunos',
        url: URL_IMPORTAR,
        chamar: (alvo) => alvo.importarAlunos([criarDtoAdicionar()]),
        resposta: { totalCriados: 1, criados: [] },
      },
    ];

    it.each(MUTACOES)('$acao também recarrega a lista', ({ url, chamar, resposta }) => {
      facade.aplicarFiltros({ pesquisa: 'ana' } as FiltroListaInterface);
      proximaBusca();

      inscricoes.add(chamar(facade).subscribe());
      http.expectOne(url).flush(resposta);

      expect(proximaBusca().pesquisa).toBe('ana');
    });

    it('a recarga só acontece depois da resposta, não no momento da chamada', () => {
      inscricoes.add(facade.adicionar(criarDtoAdicionar()).subscribe());

      const criacao = http.expectOne(URL_ALUNOS);
      vi.advanceTimersByTime(0);
      http.expectNone(URL_BUSCA);

      criacao.flush(null);
      expect(proximaBusca()).toBeDefined();
    });

    it('mutação que falha não recarrega a lista', () => {
      inscricoes.add(facade.adicionar(criarDtoAdicionar()).subscribe({ error: () => undefined }));

      http
        .expectOne(URL_ALUNOS)
        .flush('CPF já cadastrado', { status: 422, statusText: 'Unprocessable Entity' });
      vi.advanceTimersByTime(0);

      http.expectNone(URL_BUSCA);
    });
  });

  describe('o cache de buscarSugestoes', () => {
    it('termo vazio devolve lista vazia sem tocar a rede', () => {
      const emitidas = coletarSugestoes('   ');

      expect(emitidas).toEqual([[]]);
      http.expectNone(URL_BUSCA);
    });

    it('a primeira busca vai à rede, pedindo apenas cinco resultados', () => {
      const emitidas = coletarSugestoes('ana');

      const requisicao = http.expectOne(URL_BUSCA);
      expect((requisicao.request.body as AlunoFiltro).tamanhoPagina).toBe(5);
      expect((requisicao.request.body as AlunoFiltro).pesquisa).toBe('ana');
      requisicao.flush(criarPaginaCom('Ana Souza'));

      expect(emitidas[0].map((aluno) => aluno.nome)).toEqual(['Ana Souza']);
    });

    it('a sugestão ignora o filtro vigente da tela e parte sempre do filtro padrão', () => {
      facade.aplicarFiltros({ pesquisa: 'bruno', ativo: false } as FiltroListaInterface);
      proximaBusca();

      coletarSugestoes('ana');

      const filtro = http.expectOne(URL_BUSCA).request.body as AlunoFiltro;
      expect(filtro.pesquisa).toBe('ana');
      expect(filtro.ativo).toBeNull();
      expect(filtro.pagina).toBe(1);
      http.expectNone(URL_BUSCA);
    });

    it('a segunda busca do mesmo termo sai do cache, sem nova requisição', () => {
      coletarSugestoes('ana');
      http.expectOne(URL_BUSCA).flush(criarPaginaCom('Ana Souza'));

      const emitidas = coletarSugestoes('ana');

      expect(emitidas[0].map((aluno) => aluno.nome)).toEqual(['Ana Souza']);
      http.expectNone(URL_BUSCA);
    });

    it('o termo é normalizado: espaços e maiúsculas compartilham a mesma entrada', () => {
      coletarSugestoes('ana');
      http.expectOne(URL_BUSCA).flush(criarPaginaCom('Ana Souza'));

      const emitidas = coletarSugestoes('  ANA  ');

      expect(emitidas[0].map((aluno) => aluno.nome)).toEqual(['Ana Souza']);
      http.expectNone(URL_BUSCA);
    });

    it('uma mutação invalida o cache, então o mesmo termo volta à rede', () => {
      coletarSugestoes('ana');
      http.expectOne(URL_BUSCA).flush(criarPaginaCom('Ana Souza'));

      inscricoes.add(facade.adicionar(criarDtoAdicionar()).subscribe());
      http.expectOne(URL_ALUNOS).flush(null);
      proximaBusca();

      coletarSugestoes('ana');
      http.expectOne(URL_BUSCA).flush(criarPaginaCom('Ana Souza', 'Ana Paula'));
    });

    it('o logout invalida o cache, então o mesmo termo volta à rede', () => {
      coletarSugestoes('ana');
      http.expectOne(URL_BUSCA).flush(criarPaginaCom('Ana Souza'));

      estaLogado$.next(false);

      coletarSugestoes('ana');
      http.expectOne(URL_BUSCA).flush(criarPaginaCom('Ana Souza'));
    });
  });

  describe('o stream de resultado', () => {
    it('duas mudanças no mesmo tick colapsam em uma requisição só, com o último valor', () => {
      facade.mudarPagina(2);
      facade.mudarPagina(3);

      vi.advanceTimersByTime(0);

      const requisicoes = http.match(URL_BUSCA);
      expect(requisicoes).toHaveLength(1);
      expect((requisicoes[0].request.body as AlunoFiltro).pagina).toBe(3);
      requisicoes[0].flush(PAGINA_VAZIA);
    });
  });

  describe('ordenacaoAtual$', () => {
    it('nasce nula e não reemite quando a ordenação não mudou', () => {
      const emitidas: (OrdenacaoTabela | null)[] = [];
      inscricoes.add(facade.ordenacaoAtual$.subscribe((valor) => emitidas.push(valor)));

      facade.ordenarPor(OrdenacaoAlunoEnum.NOME);
      proximaBusca();
      facade.mudarPagina(2);
      proximaBusca();

      expect(emitidas).toEqual([
        null,
        { campo: OrdenacaoAlunoEnum.NOME, direcao: DirecaoOrdenacaoEnum.ASC },
      ]);
    });
  });
});
