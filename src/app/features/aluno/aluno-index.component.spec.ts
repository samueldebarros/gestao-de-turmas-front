import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlunoIndex } from './aluno-index.component';

describe('AlunoIndex', () => {
  let component: AlunoIndex;
  let fixture: ComponentFixture<AlunoIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoIndex],
    }).compileComponents();

    fixture = TestBed.createComponent(AlunoIndex);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
