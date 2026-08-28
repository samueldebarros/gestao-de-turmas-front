import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environments';
import { DocenteAdicionarDTO } from '../../shared/interfaces/dto/docente-adicionar-dto.interface';
import { DocenteEditarDTO } from '../../shared/interfaces/dto/docente-editar-dto.interface';
import { DocenteDetalheInterface } from '../../shared/interfaces/entities/docente-detalhe.interface';
import { DocenteListaInterface } from '../../shared/interfaces/entities/docente-lista.interface';
import { DocenteSqlInterface } from '../../shared/interfaces/entities/docente-sql.interface';
import { DocenteFiltro } from '../../shared/interfaces/ui/docente-filtro.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { DocenteService } from './docente.service';

const URL_ESPERADA = `${environment.apiUrl}/docentes`;
const URL_BUSCA = `${URL_ESPERADA}/buscar`;

const FILTRO_PADRAO: DocenteFiltro = {
  pagina: 1,
  tamanhoPagina: 10,
  pesquisa: '',
  ativo: null,
  ordenacao: null,
  direcao: null,
};

const PAGINA_CAPTURADA: ResultadoPaginado<DocenteListaInterface> = {
  itens: [
    {
      id: 5,
      nome: 'Arthur Professor',
      email: 'arthur.professor@email.com',
      disciplinaNome: null,
      ativo: false,
    },
    {
      id: 11,
      nome: 'Valentina Professora',
      email: 'valentina.professora@edu.com.br',
      disciplinaNome: 'Engenharia de Requisitos',
      ativo: true,
    },
  ],
  paginaAtual: 1,
  totalPaginas: 4,
  totalResultados: 14,
  tamanhoPagina: 4,
};

const PAGINA_VAZIA_CAPTURADA: ResultadoPaginado<DocenteListaInterface> = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

// Colado do CONTRATO-DOCENTES-CADASTRO-CAPTURADO.md §2.1 — resposta literal do
// servidor para o docente 16, que nao tem disciplina.
const DETALHE_CAPTURADO: DocenteDetalheInterface = {
  id: 16,
  nome: 'Teste Docente Sem Disciplina',
  email: 'teste.semdisc@email.com',
  dataNascimento: '1985-11-22',
  disciplinaId: null,
  ativo: true,
};

const NOVO_DOCENTE: DocenteAdicionarDTO = {
  nome: 'Teste Docente Com Disciplina',
  cpf: '111.222.333-96',
  email: 'teste.comdisc@email.com',
  dataNascimento: '1990-05-10',
  disciplinaId: 2,
};

const EDICAO: DocenteEditarDTO = {
  id: 15,
  nome: 'Teste Docente Editado',
  email: 'teste.editado@email.com',
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
  {
    id: 2,
    docenteNome: 'Bruno',
    docenteEmail: 'bruno@escola.br',
    disciplinaNome: 'História',
    cargaHoraria: 20,
  },
];

describe('DocenteService', () => {
  let service: DocenteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocenteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('obterDocentesDisciplinasSql', () => {
    it('chama GET na URL montada a partir do environment', () => {
      service.obterDocentesDisciplinasSql().subscribe();

      const requisicao = http.expectOne(URL_ESPERADA);
      expect(requisicao.request.method).toBe('GET');
      requisicao.flush([]);
    });

    it('entrega ao assinante o corpo da resposta', () => {
      let recebido: DocenteSqlInterface[] | undefined;
      service.obterDocentesDisciplinasSql().subscribe((docentes) => (recebido = docentes));

      http.expectOne(URL_ESPERADA).flush(DOCENTES);

      expect(recebido).toEqual(DOCENTES);
    });

    it('é frio: não dispara requisição sem assinante', () => {
      service.obterDocentesDisciplinasSql();

      http.expectNone(URL_ESPERADA);
    });

    it('deixa o erro subir para quem orquestra, sem tratar', () => {
      let status: number | undefined;
      service.obterDocentesDisciplinasSql().subscribe({
        error: (erro) => (status = erro.status),
      });

      http.expectOne(URL_ESPERADA).flush('falhou', { status: 500, statusText: 'Server Error' });

      expect(status).toBe(500);
    });
  });

  describe('buscarDocentes', () => {
    it('chama POST em /buscar levando o filtro no CORPO, nunca na query string', () => {
      service.buscarDocentes(FILTRO_PADRAO).subscribe();

      const requisicao = http.expectOne(URL_BUSCA);
      expect(requisicao.request.method).toBe('POST');
      expect(requisicao.request.body).toEqual(FILTRO_PADRAO);
      expect(requisicao.request.urlWithParams).toBe(URL_BUSCA);
      requisicao.flush(PAGINA_CAPTURADA);
    });

    it('entrega o envelope com os cinco campos capturados do servidor', () => {
      let recebido: ResultadoPaginado<DocenteListaInterface> | undefined;
      service.buscarDocentes(FILTRO_PADRAO).subscribe((pagina) => (recebido = pagina));

      http.expectOne(URL_BUSCA).flush(PAGINA_CAPTURADA);

      expect(recebido).toEqual(PAGINA_CAPTURADA);
      expect(recebido?.itens[0]?.disciplinaNome).toBeNull();
      expect(recebido?.itens[1]?.disciplinaNome).toBe('Engenharia de Requisitos');
    });

    it('aguenta a resposta vazia: itens é [] e totalPaginas é 0, não 1', () => {
      let recebido: ResultadoPaginado<DocenteListaInterface> | undefined;
      service.buscarDocentes(FILTRO_PADRAO).subscribe((pagina) => (recebido = pagina));

      http.expectOne(URL_BUSCA).flush(PAGINA_VAZIA_CAPTURADA);

      expect(recebido?.itens).toEqual([]);
      expect(recebido?.totalPaginas).toBe(0);
    });

    it('deixa subir o 400 de ordenação inválida, que vem em texto puro', () => {
      let status: number | undefined;
      service.buscarDocentes(FILTRO_PADRAO).subscribe({ error: (erro) => (status = erro.status) });

      http
        .expectOne(URL_BUSCA)
        .flush('Ordenação Inválida', { status: 400, statusText: 'Bad Request' });

      expect(status).toBe(400);
    });
  });

  describe('obterDocentePorId', () => {
    it('chama GET em /{id}', () => {
      service.obterDocentePorId(16).subscribe();

      const requisicao = http.expectOne(`${URL_ESPERADA}/16`);
      expect(requisicao.request.method).toBe('GET');
      requisicao.flush(DETALHE_CAPTURADO);
    });

    it('entrega os seis campos capturados do servidor', () => {
      let recebido: DocenteDetalheInterface | undefined;
      service.obterDocentePorId(16).subscribe((docente) => (recebido = docente));

      http.expectOne(`${URL_ESPERADA}/16`).flush(DETALHE_CAPTURADO);

      expect(recebido).toEqual(DETALHE_CAPTURADO);
    });

    it('o detalhe NÃO traz cpf — o campo é imutável e não trafega', () => {
      let recebido: DocenteDetalheInterface | undefined;
      service.obterDocentePorId(16).subscribe((docente) => (recebido = docente));

      http.expectOne(`${URL_ESPERADA}/16`).flush(DETALHE_CAPTURADO);

      expect(Object.keys(recebido ?? {}).sort()).toEqual([
        'ativo',
        'dataNascimento',
        'disciplinaId',
        'email',
        'id',
        'nome',
      ]);
      expect(recebido).not.toHaveProperty('cpf');
    });

    // O servidor usa DateOnly, que serializa "1985-11-22" — sem hora, sem T e sem
    // timezone. E o contrato do date-picker deste projeto e exatamente yyyy-MM-dd,
    // entao o valor entra no formulario sem conversao. Este teste guarda o drop-in:
    // se o back trocar DateOnly por DateTime, a data chega com hora e ele reprova.
    it('dataNascimento chega como yyyy-MM-dd puro, pronto para o date-picker', () => {
      let recebido: DocenteDetalheInterface | undefined;
      service.obterDocentePorId(16).subscribe((docente) => (recebido = docente));

      http.expectOne(`${URL_ESPERADA}/16`).flush(DETALHE_CAPTURADO);

      expect(recebido?.dataNascimento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('sem vínculo, disciplinaId vem presente e null — não ausente, não 0', () => {
      let recebido: DocenteDetalheInterface | undefined;
      service.obterDocentePorId(16).subscribe((docente) => (recebido = docente));

      http.expectOne(`${URL_ESPERADA}/16`).flush(DETALHE_CAPTURADO);

      expect(recebido).toHaveProperty('disciplinaId');
      expect(recebido?.disciplinaId).toBeNull();
    });

    it('deixa subir o 404 de id inexistente ou docente inativo', () => {
      let status: number | undefined;
      service.obterDocentePorId(99999).subscribe({ error: (erro) => (status = erro.status) });

      http
        .expectOne(`${URL_ESPERADA}/99999`)
        .flush({ title: 'Not Found', status: 404 }, { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });

  describe('adicionarDocente', () => {
    it('chama POST na raiz do recurso, não em /buscar', () => {
      service.adicionarDocente(NOVO_DOCENTE).subscribe();

      const requisicao = http.expectOne(URL_ESPERADA);
      expect(requisicao.request.method).toBe('POST');
      expect(requisicao.request.body).toEqual(NOVO_DOCENTE);
      requisicao.flush(null, { status: 201, statusText: 'Created' });
    });

    it('completa sem valor no 201 sem corpo', () => {
      let completou = false;
      service.adicionarDocente(NOVO_DOCENTE).subscribe({ complete: () => (completou = true) });

      http.expectOne(URL_ESPERADA).flush(null, { status: 201, statusText: 'Created' });

      expect(completou).toBe(true);
    });

    // 422 e status novo nesta fatia: CPF duplicado, disciplina inativa e idade
    // acima de 120 caem nele, com corpo em text/plain. O service nao traduz nada —
    // quem decide a mensagem e quem orquestra, e decide pelo status.
    it('deixa subir o 422 de regra de negócio, que vem em texto puro', () => {
      let status: number | undefined;
      service.adicionarDocente(NOVO_DOCENTE).subscribe({ error: (erro) => (status = erro.status) });

      http
        .expectOne(URL_ESPERADA)
        .flush('CPF já cadastrado', { status: 422, statusText: 'Unprocessable Entity' });

      expect(status).toBe(422);
    });
  });

  describe('editarDocente', () => {
    it('chama PUT em /{id}, com o id vindo do próprio DTO', () => {
      service.editarDocente(EDICAO).subscribe();

      const requisicao = http.expectOne(`${URL_ESPERADA}/${EDICAO.id}`);
      expect(requisicao.request.method).toBe('PUT');
      requisicao.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('não envia cpf: o campo é imutável e o DTO de edição não o tem', () => {
      service.editarDocente(EDICAO).subscribe();

      const requisicao = http.expectOne(`${URL_ESPERADA}/${EDICAO.id}`);
      expect(requisicao.request.body).not.toHaveProperty('cpf');
      requisicao.flush(null, { status: 204, statusText: 'No Content' });
    });

    // ⚠️ O servidor faz `docenteExistente.DisciplinaId = docente.DisciplinaId`
    // INCONDICIONALMENTE. Omitir a chave no corpo nao significa "nao mexi": o
    // binding a deixa null e o vinculo e APAGADO, com 204 de sucesso. Por isso
    // `disciplinaId` e obrigatorio no DTO — o compilador impede a omissao — e este
    // teste guarda a chave chegando ao corpo mesmo quando o valor e null.
    it('leva disciplinaId no corpo mesmo quando é null — omitir apagaria o vínculo', () => {
      service.editarDocente({ ...EDICAO, disciplinaId: null }).subscribe();

      const requisicao = http.expectOne(`${URL_ESPERADA}/${EDICAO.id}`);
      expect(requisicao.request.body).toHaveProperty('disciplinaId');
      expect(requisicao.request.body.disciplinaId).toBeNull();
      requisicao.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('completa sem valor no 204 sem corpo', () => {
      let completou = false;
      service.editarDocente(EDICAO).subscribe({ complete: () => (completou = true) });

      http
        .expectOne(`${URL_ESPERADA}/${EDICAO.id}`)
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(completou).toBe(true);
    });

    it('deixa subir o 404 de id inexistente ou docente inativo', () => {
      let status: number | undefined;
      service.editarDocente(EDICAO).subscribe({ error: (erro) => (status = erro.status) });

      http
        .expectOne(`${URL_ESPERADA}/${EDICAO.id}`)
        .flush({ title: 'Not Found', status: 404 }, { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });

  describe('inativarDocente e reativarDocente', () => {
    it.each([
      { acao: 'inativarDocente', sufixo: 'inativar' },
      { acao: 'reativarDocente', sufixo: 'reativar' },
    ] as const)('$acao chama PATCH em /{id}/$sufixo', ({ acao, sufixo }) => {
      service[acao](7).subscribe();

      const requisicao = http.expectOne(`${URL_ESPERADA}/7/${sufixo}`);
      expect(requisicao.request.method).toBe('PATCH');
      requisicao.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('completa sem valor quando o servidor responde 204 sem corpo', () => {
      let completou = false;
      service.inativarDocente(7).subscribe({ complete: () => (completou = true) });

      http
        .expectOne(`${URL_ESPERADA}/7/inativar`)
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(completou).toBe(true);
    });

    it('deixa subir o 404 de id inexistente ou já no estado pedido', () => {
      let status: number | undefined;
      service.reativarDocente(999).subscribe({ error: (erro) => (status = erro.status) });

      http
        .expectOne(`${URL_ESPERADA}/999/reativar`)
        .flush({ title: 'Not Found', status: 404 }, { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });
});
