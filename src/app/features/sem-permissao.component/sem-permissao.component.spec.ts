import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemPermissaoComponent } from './sem-permissao.component';

describe('SemPermissaoComponent', () => {
  let component: SemPermissaoComponent;
  let fixture: ComponentFixture<SemPermissaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemPermissaoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SemPermissaoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
