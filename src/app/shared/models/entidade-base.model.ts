import { EntidadeBaseInterface } from '../interfaces/entidade-base.interface';

export class EntidadeBaseModel implements EntidadeBaseInterface {
  id: number = 0;
  ativo?: boolean;
}
