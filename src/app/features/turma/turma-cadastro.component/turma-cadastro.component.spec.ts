import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurmaCadastroComponent } from './turma-cadastro.component';

describe('TurmaCadastroComponent', () => {
  let component: TurmaCadastroComponent;
  let fixture: ComponentFixture<TurmaCadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurmaCadastroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TurmaCadastroComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
