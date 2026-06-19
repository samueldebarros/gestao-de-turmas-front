import { SexoEnum } from '../../enums/sexo.enum';

export interface AlunoAdicionarDTO {
  nome: string;
  cpf: string;
  email: string;
  sexo: SexoEnum;
  dataNascimento: string;
}
