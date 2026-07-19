export default class RemoveDialog {
  constructor(openmct, options) {
    this.name = options.name;
    this.openmct = openmct;

    this.callback = options.callback;
    this.cssClass = options.cssClass || 'icon-trash';
    this.description = options.description || 'Remove action dialog';
    this.iconClass = 'error';
    this.key = 'remove';
    this.message =
      options.message ||
      `This action will permanently ${this.name.toLowerCase()}. Do you wish to continue?`;
  }

  show() {
    const dialog = this.openmct.overlays.dialog({
      iconClass: this.iconClass,
      message: this.message,
      buttons: [
        {
          label: 'Ok',
          callback: () => {
            this.callback(true);
            dialog.dismiss();
          }
        },
        {
          label: 'Cancel',
          callback: () => {
            this.callback(false);
            dialog.dismiss();
          }
        }
      ]
    });
  }
}
