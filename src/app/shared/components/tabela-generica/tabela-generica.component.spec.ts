import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelaGenerica } from './tabela-generica.component';

describe('TabelaGenerica', () => {
  let component: TabelaGenerica;
  let fixture: ComponentFixture<TabelaGenerica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabelaGenerica],
    }).compileComponents();

    fixture = TestBed.createComponent(TabelaGenerica);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
