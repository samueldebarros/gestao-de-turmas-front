import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { GrupoDisciplinaInterface } from '../../../interfaces/ui/grupo-disciplina.interface';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-passo-disciplinas',
  imports: [TranslatePipe],
  templateUrl: './passo-disciplinas.component.html',
  styleUrl: './passo-disciplinas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassoDisciplinasComponent {
  @Input() grupos: GrupoDisciplinaInterface[] = [];
  @Input() selecionados: number[] = [];
  @Output() selecionadosChange = new EventEmitter<number[]>();

  idSelecionadoDoGrupo(grupo: GrupoDisciplinaInterface): number | null {
    const ids = new Set(grupo.docentes.map((docente) => docente.id));
    return this.selecionados.find((id) => ids.has(id)) ?? null;
  }

  estaMarcada(grupo: GrupoDisciplinaInterface): boolean {
    return this.idSelecionadoDoGrupo(grupo) !== null;
  }

  alternarDisciplina(grupo: GrupoDisciplinaInterface, evento: Event): void {
    const marcada = (evento.target as HTMLInputElement).checked;
    const semGrupo = this.semOsIdsDoGrupo(grupo);
    this.selecionadosChange.emit(marcada ? [...semGrupo, grupo.docentes[0].id] : semGrupo);
  }

  escolherDocente(grupo: GrupoDisciplinaInterface, evento: Event): void {
    const docenteId = Number((evento.target as HTMLSelectElement).value);
    this.selecionadosChange.emit([...this.semOsIdsDoGrupo(grupo), docenteId]);
  }

  private semOsIdsDoGrupo(grupo: GrupoDisciplinaInterface): number[] {
    const ids = new Set(grupo.docentes.map((docente) => docente.id));
    return this.selecionados.filter((id) => !ids.has(id));
  }
}
