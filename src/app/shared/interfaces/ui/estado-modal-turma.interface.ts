import { TurmaInterface } from '../entities/turma.interface';

export type EstadoModalTurma = { modo: 'fechado' } | { modo: 'editar'; turma: TurmaInterface };
