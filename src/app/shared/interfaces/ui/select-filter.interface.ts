import { SelectOptionInterface } from './select-option.interface';

export interface SelectFilterInterface {
  controlName: string;
  label: string;
  options: SelectOptionInterface[];
  placeholder: string;
}
