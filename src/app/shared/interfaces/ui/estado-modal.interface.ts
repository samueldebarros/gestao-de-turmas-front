import { AlunoInterface } from '../entities/aluno.interface';

export type EstadoModal =
  | { modo: 'fechado' }
  | { modo: 'adicionar' }
  | { modo: 'editar'; aluno: AlunoInterface };
