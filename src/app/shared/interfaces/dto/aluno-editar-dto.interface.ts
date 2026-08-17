import { SexoEnum } from '../../enums/sexo.enum';

export interface AlunoEditarDTO {
  id: number;
  nome: string;
  dataNascimento: string;
  sexo: SexoEnum;
  email: string;
}
