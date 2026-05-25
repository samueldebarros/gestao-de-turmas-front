import { SexoEnum } from '../enums/sexo.enum';

export interface AlunoEditarDTO {
  id: number;
  nome: string;
  email: string;
  sexo: SexoEnum;
  dataNascimento: string;
}
