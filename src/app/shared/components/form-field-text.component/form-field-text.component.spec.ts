import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldTextComponent } from './form-field-text.component';

describe('FormFieldTextComponent', () => {
  let component: FormFieldTextComponent;
  let fixture: ComponentFixture<FormFieldTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldTextComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
