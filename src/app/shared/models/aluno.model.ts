import { SexoEnum } from '../enums/sexo.enum';
import { AlunoInterface } from '../interfaces/aluno.interface';

export class AlunoModel implements AlunoInterface {
  matricula: string;
  nome: string;
  cpf: string;
  email: string;
  sexo: SexoEnum;
  dataNascimento: Date;
  sexoDescricao?: string;
  id: number;
  ativo?: boolean;

  constructor() {
    this.matricula = '';
    this.nome = '';
    this.cpf = '';
    this.email = '';
    this.sexo = 1;
    this.dataNascimento = new Date();
    this.id = 0;
    this.ativo = false;
  }
}
