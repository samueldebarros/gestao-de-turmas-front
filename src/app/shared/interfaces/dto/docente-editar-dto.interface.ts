export interface DocenteEditarDTO {
  id: number;
  nome: string;
  email: string | null;
  dataNascimento: string;
  disciplinaId: number | null;
}
