import { EntidadeBaseInterface } from '../interfaces/entities/entidade-base.interface';

export class EntidadeBaseModel implements EntidadeBaseInterface {
  id: number = 0;
  ativo?: boolean;
}
