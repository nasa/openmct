import Clipboard from '@/utils/clipboard';

export default class CopyToClipboardAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-duplicate';
        this.description = 'Copy to Clipboard action';
        this.group = "action";
        this.key = 'copyToClipboard';
        this.name = 'Copy to Clipboard';
        this.priority = 9;
    }

    invoke(objectPath = null, viewContext) {
        const formattedValue = viewContext.formattedValueForCopy();
        Clipboard.updateClipboard(formattedValue.value)
            .then(() => {
                this.openmct.notifications.info(`Success : copied to clipboard '${formattedValue.value}'`);
            });
    }

    appliesTo(objectPath = null, viewContext) {
        if (viewContext && viewContext.getViewKey) {
            return viewContext.getViewKey().includes('alphanumeric-format');
        }

        return false;
    }
}
