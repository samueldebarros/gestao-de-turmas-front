import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environments';
import { SexoEnum } from '../../shared/enums/sexo.enum';
import { AlunoAdicionarDTO } from '../../shared/interfaces/dto/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/dto/aluno-editar-dto.interface';
import { ImportacaoResultado } from '../../shared/interfaces/dto/importacao-alunos.interface';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { AlunoFiltro } from '../../shared/interfaces/ui/aluno-filtro.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { AlunoService } from './aluno.service';

const URL_ALUNOS = `${environment.apiUrl}/alunos`;

const criarFiltro = (): AlunoFiltro => ({
  pagina: 1,
  tamanhoPagina: 10,
  pesquisa: 'ana',
  sexo: null,
  ativo: true,
  ordenacao: null,
  direcao: null,
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

const criarEnvelope = () => ({
  itens: [
    {
      id: 7,
      matricula: '2026001',
      nome: 'Ana Souza',
      cpf: '529.***.***-25',
      email: 'ana.souza@escola.com',
      sexo: SexoEnum.FEMININO,
      dataNascimento: '2008-03-12',
      ativo: true,
    },
  ],
  paginaAtual: 1,
  totalPaginas: 3,
  totalResultados: 25,
  tamanhoPagina: 10,
});

describe('AlunoService', () => {
  let service: AlunoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AlunoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('obterTodosOsAlunos', () => {
    it('chama POST em /buscar levando o filtro no corpo, e não na query string', () => {
      const filtro = criarFiltro();

      service.obterTodosOsAlunos(filtro).subscribe();

      const requisicao = http.expectOne(`${URL_ALUNOS}/buscar`);
      expect(requisicao.request.method).toBe('POST');
      expect(requisicao.request.body).toEqual(filtro);
      expect(requisicao.request.params.keys()).toEqual([]);
      requisicao.flush(criarEnvelope());
    });

    it('entrega o envelope paginado com os cinco campos do servidor', () => {
      const envelope = criarEnvelope();
      let recebido: ResultadoPaginado<AlunoInterface> | undefined;
      service.obterTodosOsAlunos(criarFiltro()).subscribe((pagina) => (recebido = pagina));

      http.expectOne(`${URL_ALUNOS}/buscar`).flush(envelope);

      expect(recebido).toEqual(envelope);
    });

    it('dataNascimento chega como string, apesar de a interface declarar Date', () => {
      let recebido: ResultadoPaginado<AlunoInterface> | undefined;
      service.obterTodosOsAlunos(criarFiltro()).subscribe((pagina) => (recebido = pagina));

      http.expectOne(`${URL_ALUNOS}/buscar`).flush(criarEnvelope());

      expect(typeof recebido?.itens[0].dataNascimento).toBe('string');
    });
  });

  describe('adicionarAluno', () => {
    it('chama POST na raiz do recurso, não em /buscar, com o DTO no corpo', () => {
      const dto = criarDtoAdicionar();

      service.adicionarAluno(dto).subscribe();

      const requisicao = http.expectOne(URL_ALUNOS);
      expect(requisicao.request.method).toBe('POST');
      expect(requisicao.request.body).toEqual(dto);
      requisicao.flush(null);
    });
  });

  describe('editarAluno', () => {
    it('chama PUT em /{id}, com o id vindo do próprio DTO', () => {
      const dto = criarDtoEditar();

      service.editarAluno(dto).subscribe();

      const requisicao = http.expectOne(`${URL_ALUNOS}/7`);
      expect(requisicao.request.method).toBe('PUT');
      expect(requisicao.request.body).toEqual(dto);
      requisicao.flush(null);
    });

    it('não envia cpf: o campo é imutável e o DTO de edição não o tem', () => {
      service.editarAluno(criarDtoEditar()).subscribe();

      const requisicao = http.expectOne(`${URL_ALUNOS}/7`);
      expect(requisicao.request.body).not.toHaveProperty('cpf');
      requisicao.flush(null);
    });
  });

  describe('importarAlunos', () => {
    it('embrulha a lista em { alunos } e não envia o array cru', () => {
      const dtos = [criarDtoAdicionar()];

      service.importarAlunos(dtos).subscribe();

      const requisicao = http.expectOne(`${URL_ALUNOS}/importar`);
      expect(requisicao.request.method).toBe('POST');
      expect(requisicao.request.body).toEqual({ alunos: dtos });
      expect(Array.isArray(requisicao.request.body)).toBe(false);
      requisicao.flush({ totalCriados: 1, criados: [] });
    });

    it('entrega o resultado da importação ao assinante', () => {
      const resultado: ImportacaoResultado = {
        totalCriados: 2,
        criados: [{ id: 7, matricula: '2026001', cpf: '52998224725' }],
      };
      let recebido: ImportacaoResultado | undefined;
      service.importarAlunos([criarDtoAdicionar()]).subscribe((valor) => (recebido = valor));

      http.expectOne(`${URL_ALUNOS}/importar`).flush(resultado);

      expect(recebido).toEqual(resultado);
    });
  });

  describe('inativarAluno e reativarAluno', () => {
    it.each([
      { acao: 'inativar', chamar: (alvo: AlunoService) => alvo.inativarAluno(7) },
      { acao: 'reativar', chamar: (alvo: AlunoService) => alvo.reativarAluno(7) },
    ])('$acao chama PATCH em /{id}/$acao com corpo vazio', ({ acao, chamar }) => {
      chamar(service).subscribe();

      const requisicao = http.expectOne(`${URL_ALUNOS}/7/${acao}`);
      expect(requisicao.request.method).toBe('PATCH');
      expect(requisicao.request.body).toEqual({});
      requisicao.flush(null);
    });
  });

  describe('o observable é frio', () => {
    it('sem assinante nenhuma requisição sai, nem a de leitura nem a de escrita', () => {
      service.obterTodosOsAlunos(criarFiltro());
      service.adicionarAluno(criarDtoAdicionar());

      http.expectNone(`${URL_ALUNOS}/buscar`);
      http.expectNone(URL_ALUNOS);
    });
  });

  describe('erro', () => {
    it('deixa o 422 subir para quem orquestra, sem tratar', () => {
      let status: number | undefined;
      let corpo: unknown;
      service.adicionarAluno(criarDtoAdicionar()).subscribe({
        error: (erro) => {
          status = erro.status;
          corpo = erro.error;
        },
      });

      http
        .expectOne(URL_ALUNOS)
        .flush('CPF já cadastrado', { status: 422, statusText: 'Unprocessable Entity' });

      expect(status).toBe(422);
      expect(corpo).toBe('CPF já cadastrado');
    });
  });
});
