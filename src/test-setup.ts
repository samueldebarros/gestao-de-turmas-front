const dialog = globalThis.HTMLDialogElement?.prototype as
  | (HTMLDialogElement & { showModal: unknown; close: unknown })
  | undefined;

if (dialog && typeof dialog.showModal !== 'function') {
  dialog.showModal = function (this: HTMLDialogElement): void {
    this.open = true;
  };
  dialog.show = function (this: HTMLDialogElement): void {
    this.open = true;
  };
  dialog.close = function (this: HTMLDialogElement): void {
    this.open = false;
  };
}
