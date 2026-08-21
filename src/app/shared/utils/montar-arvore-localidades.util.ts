import { LocalidadeInterface } from '../interfaces/entities/localidade.interface';
import { ChaveNo, Indice, NoArvore } from '../interfaces/ui/no-arvore.interface';
import { chaveLocalidade } from './chaves-arvore.util';
import { traduzirFilhos } from './traduzir-filhos.util';

export function montarArvoreLocalidades(
  raizes: LocalidadeInterface[],
  indice: Indice<LocalidadeInterface>,
): NoArvore<LocalidadeInterface>[] {
  return raizes.map((local) => noLocalidade('', local, indice));
}

function noLocalidade(
  chavePai: ChaveNo,
  local: LocalidadeInterface,
  indice: Indice<LocalidadeInterface>,
): NoArvore<LocalidadeInterface> {
  const chave = chaveLocalidade(chavePai, local);

  return {
    chave,
    rotulo: local.nome,
    entidade: local,
    filhos:
      local.nivel === 'distrito'
        ? { status: 'folha' }
        : traduzirFilhos(indice.get(chave), (filhos) =>
            filhos.map((filho) => noLocalidade(chave, filho, indice)),
          ),
  };
}
