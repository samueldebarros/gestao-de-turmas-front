import { DocenteSqlInterface } from '../interfaces/entities/docente-sql.interface';
import { agruparPorDisciplina } from './agrupar-por-disciplina.util';

const criarDocente = (
  id: number,
  disciplinaNome: string,
  docenteNome = `Docente ${id}`,
): DocenteSqlInterface => ({
  id,
  docenteNome,
  docenteEmail: `docente${id}@escola.com`,
  disciplinaId: disciplinaNome.length,
  disciplinaNome,
  cargaHoraria: 40,
});

describe('agruparPorDisciplina', () => {
  it('devolve lista vazia quando não há docente algum', () => {
    expect(agruparPorDisciplina([])).toEqual([]);
  });

  it('dois docentes da mesma disciplina caem num único grupo', () => {
    const resultado = agruparPorDisciplina([
      criarDocente(1, 'Matemática', 'Ana'),
      criarDocente(2, 'Matemática', 'Bruno'),
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].disciplinaNome).toBe('Matemática');
    expect(resultado[0].docentes.map((docente) => docente.docenteNome)).toEqual(['Ana', 'Bruno']);
  });

  it('disciplinas intercaladas preservam a ordem de primeira aparição', () => {
    const resultado = agruparPorDisciplina([
      criarDocente(1, 'Matemática', 'Ana'),
      criarDocente(2, 'História', 'Bruno'),
      criarDocente(3, 'Matemática', 'Carla'),
    ]);

    expect(resultado.map((grupo) => grupo.disciplinaNome)).toEqual(['Matemática', 'História']);
    expect(resultado[0].docentes.map((docente) => docente.docenteNome)).toEqual(['Ana', 'Carla']);
  });

  it('não altera o array recebido', () => {
    const entrada = [criarDocente(1, 'Matemática'), criarDocente(2, 'História')];

    agruparPorDisciplina(entrada);

    expect(entrada.map((docente) => docente.id)).toEqual([1, 2]);
  });

  it('os grupos reaproveitam a referência dos docentes de entrada', () => {
    const entrada = [criarDocente(1, 'Matemática')];

    const resultado = agruparPorDisciplina(entrada);

    expect(resultado[0].docentes[0]).toBe(entrada[0]);
  });
});
