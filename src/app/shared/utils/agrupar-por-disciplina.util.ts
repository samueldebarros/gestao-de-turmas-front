import { DocenteSqlInterface } from '../interfaces/entities/docente-sql.interface';
import { GrupoDisciplinaInterface } from '../interfaces/ui/grupo-disciplina.interface';

export function agruparPorDisciplina(docentes: DocenteSqlInterface[]): GrupoDisciplinaInterface[] {
  const mapa = new Map<string, DocenteSqlInterface[]>();

  for (const docente of docentes) {
    const grupo = mapa.get(docente.disciplinaNome) ?? [];
    grupo.push(docente);
    mapa.set(docente.disciplinaNome, grupo);
  }

  return Array.from(mapa, ([disciplinaNome, docentes]) => ({ disciplinaNome, docentes }));
}
