import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassoAlunosComponent } from './passo-alunos.component';

describe('PassoAlunosComponent', () => {
  let component: PassoAlunosComponent;
  let fixture: ComponentFixture<PassoAlunosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassoAlunosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PassoAlunosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
