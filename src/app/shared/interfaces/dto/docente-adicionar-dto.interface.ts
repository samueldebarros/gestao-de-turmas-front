export interface DocenteAdicionarDTO {
  nome: string;
  cpf: string;
  email: string | null;
  dataNascimento: string;
  disciplinaId: number | null;
}
