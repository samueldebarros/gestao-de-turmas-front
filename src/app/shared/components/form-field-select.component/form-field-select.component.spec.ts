import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldSelectComponent } from './form-field-select.component';

describe('FormFieldSelectComponent', () => {
  let component: FormFieldSelectComponent;
  let fixture: ComponentFixture<FormFieldSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldSelectComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
