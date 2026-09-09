import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environments';
import { FeatureFlagsService } from './feature-flags.service';

const CAMINHO_FLAGS = '/flags.json';

describe('FeatureFlagsService', () => {
  const valorOriginal = environment.flags.importarCsv;
  let http: HttpTestingController;

  function criarServico(importarCsv: boolean): FeatureFlagsService {
    environment.flags.importarCsv = importarCsv;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(FeatureFlagsService);
  }

  afterEach(() => {
    http.verify();
    environment.flags.importarCsv = valorOriginal;
  });

  it('reflete a flag ligada na fonte de build', () => {
    expect(criarServico(true).importarCsv()).toBe(true);
  });

  it('reflete a flag desligada na fonte de build', () => {
    expect(criarServico(false).importarCsv()).toBe(false);
  });

  it('o arquivo remoto sobrescreve o valor do build', () => {
    const servico = criarServico(true);

    servico.carregar().subscribe();
    http.expectOne(CAMINHO_FLAGS).flush({ importarCsv: false });

    expect(servico.importarCsv()).toBe(false);
  });

  it('mantem o valor do build quando o arquivo nao carrega', () => {
    const servico = criarServico(true);
    let concluiu = false;

    servico.carregar().subscribe({ complete: () => (concluiu = true) });
    http.expectOne(CAMINHO_FLAGS).error(new ProgressEvent('erro'), { status: 404 });

    expect(servico.importarCsv()).toBe(true);
    expect(concluiu).toBe(true);
  });
});
