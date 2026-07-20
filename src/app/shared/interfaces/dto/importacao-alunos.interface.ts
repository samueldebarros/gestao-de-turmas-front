import { AlunoAdicionarDTO } from './aluno-adicionar-dto.interface';

export interface ImportarAlunosRequest {
  alunos: AlunoAdicionarDTO[];
}

export interface AlunoCriado {
  id: number;
  matricula: string;
  cpf: string;
}

export interface ImportacaoResultado {
  totalCriados: number;
  criados: AlunoCriado[];
}

export interface LinhaErro {
  indice: number;
  campo: string;
  motivo: string;
}

export interface ImportacaoErro {
  erros: LinhaErro[];
}
