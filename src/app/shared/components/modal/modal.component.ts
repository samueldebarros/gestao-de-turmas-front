import {
  AfterViewInit,
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
export class Modal implements OnChanges, AfterViewInit {
  @Input() titulo: string = '';
  @Input() visivel: boolean = false;
  @Output() visivelChange = new EventEmitter<boolean>();

  @ViewChild('Dialog') dialog!: ElementRef<HTMLDialogElement>;

  ngAfterViewInit(): void {
    this.sincronizarDialog();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visivel'] && this.dialog) {
      this.sincronizarDialog();
    }
  }

  private sincronizarDialog(): void {
    const modal = this.dialog.nativeElement;
    if (this.visivel) modal.showModal();
    else modal.close();
  }

  fecharModal() {
    this.visivelChange.emit(false);
  }
}
