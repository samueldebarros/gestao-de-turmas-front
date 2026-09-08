import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environments';
import { DisciplinaInterface } from '../../shared/interfaces/entities/disciplina.interface';
import { DisciplinaFacadeService } from './disciplina-facade.service';

const URL_ESPERADA = `${environment.apiUrl}/disciplinas`;

const DISCIPLINAS: DisciplinaInterface[] = [
  { id: 2, nome: 'Programação', ativo: true },
  { id: 8, nome: 'Geografia', ativo: false },
];

describe('DisciplinaFacadeService', () => {
  let facade: DisciplinaFacadeService;
  let http: HttpTestingController;
  let inscricoes: Subscription;

  beforeEach(() => {
    inscricoes = new Subscription();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    facade = TestBed.inject(DisciplinaFacadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    inscricoes.unsubscribe();
    http.verify();
  });

  it('dois assinantes simultâneos disparam uma requisição, não duas', () => {
    inscricoes.add(facade.disciplinas$.subscribe());
    inscricoes.add(facade.disciplinas$.subscribe());

    http.expectOne(URL_ESPERADA).flush(DISCIPLINAS);
  });

  it('assinante que chega depois recebe o valor guardado, sem nova requisição', () => {
    inscricoes.add(facade.disciplinas$.subscribe());
    http.expectOne(URL_ESPERADA).flush(DISCIPLINAS);

    let recebido: DisciplinaInterface[] | undefined;
    inscricoes.add(facade.disciplinas$.subscribe((d) => (recebido = d)));

    expect(recebido).toEqual(DISCIPLINAS);
    http.expectNone(URL_ESPERADA);
  });

  it('caracterização: não refaz a busca depois que a fonte completou, mesmo sem assinante vivo', () => {
    const primeira = facade.disciplinas$.subscribe();
    http.expectOne(URL_ESPERADA).flush(DISCIPLINAS);
    primeira.unsubscribe();

    let recebido: DisciplinaInterface[] | undefined;
    inscricoes.add(facade.disciplinas$.subscribe((d) => (recebido = d)));

    expect(recebido).toEqual(DISCIPLINAS);
    http.expectNone(URL_ESPERADA);
  });

  it('expõe a lista inteira, inativas inclusas, porque quem filtra é a tela', () => {
    let recebido: DisciplinaInterface[] | undefined;
    inscricoes.add(facade.disciplinas$.subscribe((d) => (recebido = d)));

    http.expectOne(URL_ESPERADA).flush(DISCIPLINAS);

    expect(recebido).toHaveLength(2);
    expect(recebido?.some((disciplina) => !disciplina.ativo)).toBe(true);
  });

  it('deixa o erro subir: quem mostra alerta é quem orquestra a tela', () => {
    let status: number | undefined;
    inscricoes.add(facade.disciplinas$.subscribe({ error: (erro) => (status = erro.status) }));

    http.expectOne(URL_ESPERADA).flush('falhou', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});
