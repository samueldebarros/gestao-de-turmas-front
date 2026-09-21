import { SexoEnum } from '../../enums/sexo.enum';
import { SituacaoEnturmamentoEnum } from '../../enums/situacao-enturmamento.enum';
import { EntidadeBaseInterface } from './entidade-base.interface';

export interface AlunoDaTurmaInterface extends EntidadeBaseInterface {
  matricula: string;
  nome: string;
  cpf: string;
  email: string | null;
  sexo: SexoEnum;
  dataNascimento: string;
  situacao: SituacaoEnturmamentoEnum;
  dataEnturmamento: string;
}
