import { DocenteDetalheInterface } from '../entities/docente-detalhe.interface';

export type EstadoModalDocente =
  | { modo: 'fechado' }
  | { modo: 'adicionar' }
  | { modo: 'editar'; docente: DocenteDetalheInterface };
