import { getDefaultNotebook } from '../utils/notebook-storage';
import { addNotebookEntry } from '../utils/notebook-entries';

export default class CopyToNotebookAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-duplicate';
        this.description = 'Copy to Notebook action';
        this.group = "action";
        this.key = 'copyToNotebook';
        this.name = 'Copy to Notebook';
        this.priority = 9;
    }

    copyToNotebook(entryText) {
        const notebookStorage = getDefaultNotebook();
        this.openmct.objects.get(notebookStorage.notebookMeta.identifier)
            .then(domainObject => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, null, entryText);

                const defaultPath = `${domainObject.name} - ${notebookStorage.section.name} - ${notebookStorage.page.name}`;
                const msg = `Saved to Notebook ${defaultPath}`;
                this.openmct.notifications.info(msg);
            });
    }

    invoke(objectPath = null, viewContext) {
        this.copyToNotebook(viewContext.formattedValueForCopy());
    }

    appliesTo(objectPath = null, viewContext) {
        if (viewContext && viewContext.getViewKey) {
            return viewContext.getViewKey().includes('alphanumeric-format');
        }

        return false;
    }
}
