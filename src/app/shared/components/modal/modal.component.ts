import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class Modal implements OnChanges {
  @Input() titulo: string = '';
  @Input() visivel: boolean = false;
  @Output() visivelChange = new EventEmitter<boolean>();

  @ViewChild('Dialog') dialog!: ElementRef<HTMLDialogElement>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visivel'] && this.dialog) {
      const modal = this.dialog.nativeElement;

      if (this.visivel) {
        modal.showModal();
      } else {
        modal.close();
      }
    }
  }

  fecharModal() {
    this.visivelChange.emit(false);
  }
}
