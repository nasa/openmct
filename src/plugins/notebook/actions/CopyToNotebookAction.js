export default class CopyToNotebookAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-folder-new';
        this.description = 'Copy to Notebook action';
        this.group = "action";
        this.key = 'copyToNotebook';
        this.name = 'Copy to Notebook';
        this.priority = 9;
    }

    invoke(objectPath = null, viewContext) {
        if (!objectPath) {
            return;
        }

        const value = viewContext.formattedValueForCopy();
        this.openmct.notifications.info(`Success : copied to notebook '${value}'`);
    }

    appliesTo(objectPath = null, viewContext) {
        if (viewContext && viewContext.getViewKey) {
            return viewContext.getViewKey().includes('alphanumeric-format');
        }

        return false;
    }
}
