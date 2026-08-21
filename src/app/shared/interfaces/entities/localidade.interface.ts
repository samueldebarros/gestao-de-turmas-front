export type NivelLocalidade = 'regiao' | 'uf' | 'municipio' | 'distrito';

export interface LocalidadeInterface {
  id: number;
  nome: string;
  nivel: NivelLocalidade;
}
