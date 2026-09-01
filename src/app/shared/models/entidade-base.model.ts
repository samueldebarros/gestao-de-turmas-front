import { EntidadeBaseInterface } from '../interfaces/entities/entidade-base.interface';

export class EntidadeBaseModel implements EntidadeBaseInterface {
  id = 0;
  ativo?: boolean;
}
