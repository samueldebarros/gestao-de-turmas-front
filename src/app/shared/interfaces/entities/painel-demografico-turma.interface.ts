import { EntidadeBaseInterface } from './entidade-base.interface';

export interface PainelDemograficoTurma {
  identificador: string;
  serie: number;
  serieDescricao: string;
  menor15: number;
  de15a17: number;
  maior18: number;
  idadeMedia: number;
}

export type PainelDemograficoLinha = PainelDemograficoTurma & EntidadeBaseInterface;
