export default class RemoveDialog {
    constructor(openmct, options) {
        this.name = options.name;
        this.openmct = openmct;
        this.callback = options.callback;
        this.cssClass = options.cssClass || 'icon-trash';
        this.description = options.description || 'Remove action dialog';
        this.iconClass = "alert";
        this.key = 'remove';
        this.message = options.message || `Warning! This action will remove this tab. Do you want to continue?`;
    }

    show() {
        const dialog = this.openmct.overlays.dialog({
            iconClass: this.iconClass,
            message: this.message,
            buttons: [
                {
                    label: "Ok",
                    callback: () => {
                        this.callback(true);
                        dialog.dismiss();
                    }
                },
                {
                    label: "Cancel",
                    callback: () => {
                        dialog.dismiss();
                    }
                }
            ]
        });
    }
}
