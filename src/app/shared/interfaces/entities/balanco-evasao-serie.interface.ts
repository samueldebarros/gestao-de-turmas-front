import { EntidadeBaseInterface } from './entidade-base.interface';

export interface BalancoEvasaoSerie {
  anoLetivo: number;
  serie: number;
  serieDescricao: string;
  totalMatriculas: number;
  alunosAtivos: number;
  alunosTrancadosOuCancelados: number;
  percentualEvasao: number;
}

export type BalancoEvasaoLinha = BalancoEvasaoSerie & EntidadeBaseInterface;
