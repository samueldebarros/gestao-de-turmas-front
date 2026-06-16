import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltroListaComponent } from './filtro-lista.component';

describe('FiltroListaComponent', () => {
  let component: FiltroListaComponent;
  let fixture: ComponentFixture<FiltroListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltroListaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FiltroListaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
