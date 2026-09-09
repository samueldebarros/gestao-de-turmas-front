import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environments';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService', () => {
  const valorOriginal = environment.flags.importarCsv;

  function criarServico(importarCsv: boolean): FeatureFlagsService {
    environment.flags.importarCsv = importarCsv;
    TestBed.configureTestingModule({});
    return TestBed.inject(FeatureFlagsService);
  }

  afterEach(() => {
    environment.flags.importarCsv = valorOriginal;
  });

  it('reflete a flag ligada na fonte', () => {
    expect(criarServico(true).importarCsv()).toBe(true);
  });

  it('reflete a flag desligada na fonte', () => {
    expect(criarServico(false).importarCsv()).toBe(false);
  });
});
