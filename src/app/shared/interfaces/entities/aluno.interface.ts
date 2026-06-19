import { SexoEnum } from '../../enums/sexo.enum';
import { EntidadeBaseInterface } from './entidade-base.interface';

export interface AlunoInterface extends EntidadeBaseInterface {
  matricula: string;
  nome: string;
  cpf: string;
  email: string;
  sexo: SexoEnum;
  dataNascimento: Date;
  sexoDescricao?: string;
}
