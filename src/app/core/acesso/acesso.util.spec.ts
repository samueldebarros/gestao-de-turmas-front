import { MAPA_ACESSO, ITENS_MENU, pode, telaInicial } from './acesso.util';
import { Permissao, PapelEscola } from './permissao.type';
import { PapelUsuario } from '../../shared/types/papel-usuario.type';

function ehPermissao(chave: string): chave is Permissao {
  return chave in MAPA_ACESSO;
}

describe('pode', () => {
  it('permite tudo ao Admin e nada ao null, em cada permissão do mapa', () => {
    for (const chave of Object.keys(MAPA_ACESSO)) {
      if (!ehPermissao(chave)) {
        continue;
      }
      expect(pode('Admin', chave)).toBe(true);
      expect(pode(null, chave)).toBe(false);
    }
  });

  it('permite ao Docente apenas alunos.acessar', () => {
    for (const chave of Object.keys(MAPA_ACESSO)) {
      if (!ehPermissao(chave)) {
        continue;
      }
      expect(pode('Docente', chave)).toBe(chave === 'alunos.acessar');
    }
  });
});

describe('telaInicial', () => {
  it('leva Admin e Coordenador para /turmas', () => {
    expect(telaInicial('Admin')).toBe('/turmas');
    expect(telaInicial('Coordenador')).toBe('/turmas');
  });

  it('leva o Docente para /alunos', () => {
    expect(telaInicial('Docente')).toBe('/alunos');
  });

  it('leva null para /login', () => {
    expect(telaInicial(null)).toBe('/login');
  });

  it.each<PapelUsuario>(['Admin', 'Coordenador', 'Docente'])(
    'leva o %s a uma tela que o próprio papel pode acessar pelo menu',
    (papel) => {
      const url = telaInicial(papel);
      const item = ITENS_MENU.find((candidato) => candidato.url === url);

      if (!item) {
        throw new Error(`nenhum item de menu leva à tela inicial do papel ${papel}`);
      }
      expect(pode(papel, item.permissao)).toBe(true);
    },
  );
});

describe('MAPA_ACESSO', () => {
  it('é somente leitura em tempo de compilação', () => {
    // @ts-expect-error o mapa é somente leitura
    MAPA_ACESSO['alunos.gerir'] = ['Docente'];
  });
});

describe('PapelEscola', () => {
  it('exclui Admin em tempo de compilação', () => {
    // @ts-expect-error o Admin não é papel da escola
    const invalido: PapelEscola = 'Admin';
    expect(invalido).toBe('Admin');
  });
});
