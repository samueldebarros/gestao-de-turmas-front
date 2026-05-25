import { TestBed } from '@angular/core/testing';

import { AlunoFacadeService } from './aluno-facade.service.js';

describe('AlunoFacadeService', () => {
  let service: AlunoFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlunoFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
