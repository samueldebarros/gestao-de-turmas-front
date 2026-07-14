import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassoDisciplinasComponent } from './passo-disciplinas.component';

describe('PassoDisciplinasComponent', () => {
  let component: PassoDisciplinasComponent;
  let fixture: ComponentFixture<PassoDisciplinasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassoDisciplinasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PassoDisciplinasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
