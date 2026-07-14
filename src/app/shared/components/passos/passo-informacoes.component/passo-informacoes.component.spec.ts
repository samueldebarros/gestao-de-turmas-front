import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassoInformacoesComponent } from './passo-informacoes.component';

describe('PassoInformacoesComponent', () => {
  let component: PassoInformacoesComponent;
  let fixture: ComponentFixture<PassoInformacoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassoInformacoesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PassoInformacoesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
