import { SexoEnum } from '../../enums/sexo.enum';

export interface AlunoAdicionarDTO {
  nome: string;
  dataNascimento: string;
  cpf: string;
  sexo: SexoEnum;
  email: string;
}
