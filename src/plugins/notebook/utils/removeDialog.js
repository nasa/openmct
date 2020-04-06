export default class RemoveDialog {
    constructor(openmct, properties) {
        this.openmct = openmct;
        this.properties = properties;
    }

    getRemoveAction() {
        const {
            buttons,
            cssClass,
            iconClass,
            message,
            name
        } = this.properties;

        return {
            name,
            cssClass,
            perform: (data) => {
                const dialog = this.openmct.overlays.dialog({
                    iconClass,
                    message,
                    buttons: buttons.map(button => {
                        const { emphasis, label, clicked = () => {} } = button;

                        return {
                            label,
                            emphasis,
                            callback: () => {
                                clicked(data);
                                dialog.dismiss();
                            }
                        }
                    })
                });
            }
        }
    }
}
