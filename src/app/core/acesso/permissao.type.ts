import { PapelUsuario } from '../../shared/types/papel-usuario.type';

export type PapelEscola = Exclude<PapelUsuario, 'Admin'>;

export type Permissao =
  | 'alunos.acessar'
  | 'alunos.gerir'
  | 'docentes.acessar'
  | 'turmas.acessar'
  | 'dashboard.acessar'
  | 'tree-view.acessar';
