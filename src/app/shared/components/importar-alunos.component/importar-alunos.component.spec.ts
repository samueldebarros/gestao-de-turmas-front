import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportarAlunosComponent } from './importar-alunos.component';

describe('ImportarAlunosComponent', () => {
  let component: ImportarAlunosComponent;
  let fixture: ComponentFixture<ImportarAlunosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportarAlunosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportarAlunosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
