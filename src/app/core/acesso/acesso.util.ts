import { PapelUsuario } from '../../shared/types/papel-usuario.type';
import { PapelEscola, Permissao } from './permissao.type';

export const MAPA_ACESSO: Readonly<Record<Permissao, readonly PapelEscola[]>> = {
  'alunos.acessar': ['Coordenador', 'Docente'],
  'alunos.gerir': ['Coordenador'],
  'docentes.acessar': ['Coordenador'],
  'turmas.acessar': ['Coordenador'],
  'dashboard.acessar': ['Coordenador'],
  'tree-view.acessar': ['Coordenador'],
};

export function pode(papel: PapelUsuario | null, permissao: Permissao): boolean {
  if (papel === null) {
    return false;
  }
  if (papel === 'Admin') {
    return true;
  }
  const papeisComAcesso: readonly PapelEscola[] = MAPA_ACESSO[permissao];
  return papeisComAcesso.includes(papel);
}

export const TELA_INICIAL: Record<PapelUsuario, string> = {
  Admin: '/turmas',
  Coordenador: '/turmas',
  Docente: '/alunos',
};

export function telaInicial(papel: PapelUsuario | null): string {
  if (papel === null) {
    return '/login';
  }
  return TELA_INICIAL[papel];
}

export const ITENS_MENU: readonly { url: string; rotulo: string; permissao: Permissao }[] = [
  { url: '/alunos', rotulo: 'NAVBAR.ALUNOS', permissao: 'alunos.acessar' },
  { url: '/docentes', rotulo: 'NAVBAR.DOCENTES', permissao: 'docentes.acessar' },
  { url: '/dashboard', rotulo: 'NAVBAR.DASHBOARD', permissao: 'dashboard.acessar' },
  { url: '/turmas', rotulo: 'NAVBAR.TURMAS', permissao: 'turmas.acessar' },
  { url: '/tree-view', rotulo: 'NAVBAR.TREE_VIEW', permissao: 'tree-view.acessar' },
];
