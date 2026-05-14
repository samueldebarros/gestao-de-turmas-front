import { SexoEnum } from '../enums/sexo.enum';

export interface AlunoCreateDTO {
  nome: string;
  cpf: string;
  email: string;
  sexo: SexoEnum;
  dataNascimento: string;
}
