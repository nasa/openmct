import Clipboard from '@/utils/clipboard';

export default class CopyToClipboardAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-folder-new';
        this.description = 'Copy to Clipboard action';
        this.group = "action";
        this.key = 'copyToClipboard';
        this.name = 'Copy to Clipboard';
        this.priority = 9;
    }

    invoke(objectPath = null, viewContext) {
        console.log('invoke', viewContext);
        if (!objectPath) {
            return;
        }

        const value = viewContext.formattedValueForCopy();
        Clipboard.updateClipboard(value)
            .then(() => {
                this.openmct.notifications.info(`Success : copied to clipboard '${value}'`);
            });
    }

    appliesTo(objectPath = null, viewContext) {
        if (viewContext && viewContext.getViewKey) {
            return viewContext.getViewKey().includes('alphanumeric-format');
        }

        return false;
    }
}
