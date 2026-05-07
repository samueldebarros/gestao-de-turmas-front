import { EntidadeBaseInterface } from "./entidade-base.interface";
import { SexoEnum } from "./sexo.enum";

export interface AlunoInterface extends EntidadeBaseInterface {
    matricula: string;
    nome: string;
    cpf: string;
    email: string;
    dataNascimento: Date;
    sexo: SexoEnum;
}
