import { DocenteSqlInterface } from '../entities/docente-sql.interface';
import { TurmaInterface } from '../entities/turma.interface';
import { EstadoBusca, Indice } from './no-arvore.interface';

export type EntidadeArvore = TurmaInterface | DocenteSqlInterface;

export type EstadoBuscaFilhos = EstadoBusca<EntidadeArvore>;

export type IndiceFilhos = Indice<EntidadeArvore>;
