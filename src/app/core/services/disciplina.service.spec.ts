import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environments';
import { DisciplinaInterface } from '../../shared/interfaces/entities/disciplina.interface';
import { DisciplinaService } from './disciplina.service';

const URL_ESPERADA = `${environment.apiUrl}/disciplinas`;

// Colado do CONTRATO-DOCENTES-CADASTRO-CAPTURADO.md §1 — recorte da resposta
// literal, preservando as duas inativas que o servidor devolve de proposito.
const CAPTURADO: DisciplinaInterface[] = [
  { id: 3, nome: 'Biologia', ativo: true },
  { id: 8, nome: 'Geografia', ativo: false },
  { id: 10, nome: 'História', ativo: false },
  { id: 2, nome: 'Programação', ativo: true },
];

describe('DisciplinaService', () => {
  let service: DisciplinaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DisciplinaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('chama GET na URL montada a partir do environment', () => {
    service.obterDisciplinas().subscribe();

    const requisicao = http.expectOne(URL_ESPERADA);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(CAPTURADO);
  });

  it('entrega o array puro, sem envelope de paginação', () => {
    let recebido: DisciplinaInterface[] | undefined;
    service.obterDisciplinas().subscribe((disciplinas) => (recebido = disciplinas));

    http.expectOne(URL_ESPERADA).flush(CAPTURADO);

    expect(recebido).toEqual(CAPTURADO);
    expect(Array.isArray(recebido)).toBe(true);
  });

  it('cada item tem exatamente id, nome e ativo', () => {
    let recebido: DisciplinaInterface[] | undefined;
    service.obterDisciplinas().subscribe((disciplinas) => (recebido = disciplinas));

    http.expectOne(URL_ESPERADA).flush(CAPTURADO);

    for (const disciplina of recebido ?? []) {
      expect(Object.keys(disciplina).sort()).toEqual(['ativo', 'id', 'nome']);
    }
  });

  // O servidor devolve as inativas de proposito: se um docente estiver vinculado a
  // uma delas, o formulario de edicao precisa conseguir exibir a disciplina atual.
  // Quem esconde do select e o componente, nao o servidor e nao esta camada — um
  // filtro aqui faria o select perder o valor vigente em silencio.
  it('não filtra: as disciplinas inativas chegam ao assinante', () => {
    let recebido: DisciplinaInterface[] | undefined;
    service.obterDisciplinas().subscribe((disciplinas) => (recebido = disciplinas));

    http.expectOne(URL_ESPERADA).flush(CAPTURADO);

    expect(recebido?.filter((disciplina) => !disciplina.ativo).map((d) => d.id)).toEqual([8, 10]);
  });

  it('é frio: não dispara requisição sem assinante', () => {
    service.obterDisciplinas();

    http.expectNone(URL_ESPERADA);
  });

  it('deixa o erro subir para quem orquestra, sem tratar', () => {
    let status: number | undefined;
    service.obterDisciplinas().subscribe({ error: (erro) => (status = erro.status) });

    http.expectOne(URL_ESPERADA).flush('falhou', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});
