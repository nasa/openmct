import { addNotebookEntry } from '../utils/notebook-entries.js';
import { getDefaultNotebook, getNotebookSectionAndPage } from '../utils/notebook-storage.js';

const COPY_TO_NOTEBOOK_ACTION_KEY = 'copyToNotebook';
class CopyToNotebookAction {
  constructor(openmct) {
    this.openmct = openmct;

    this.cssClass = 'icon-duplicate';
    this.description = 'Copy value to notebook as an entry';
    this.group = 'action';
    this.key = COPY_TO_NOTEBOOK_ACTION_KEY;
    this.name = 'Copy to Notebook';
    this.priority = 1;
  }

  copyToNotebook(entryText) {
    const notebookStorage = getDefaultNotebook();
    this.openmct.objects.get(notebookStorage.identifier).then((domainObject) => {
      addNotebookEntry(this.openmct, domainObject, notebookStorage, null, entryText);

      const { section, page } = getNotebookSectionAndPage(
        domainObject,
        notebookStorage.defaultSectionId,
        notebookStorage.defaultPageId
      );
      if (!section || !page) {
        return;
      }

      const defaultPath = `${domainObject.name} - ${section.name} - ${page.name}`;
      const msg = `Saved to Notebook ${defaultPath}`;
      this.openmct.notifications.info(msg);
    });
  }

  invoke(objectPath, view) {
    const formattedValueForCopy = view.getViewContext().row.formattedValueForCopy;

    this.copyToNotebook(formattedValueForCopy());
  }

  appliesTo(objectPath, view = {}) {
    const viewContext = view.getViewContext && view.getViewContext();
    const row = viewContext && viewContext.row;
    if (!row) {
      return;
    }

    return row.formattedValueForCopy && typeof row.formattedValueForCopy === 'function';
  }
}

export { COPY_TO_NOTEBOOK_ACTION_KEY };

export default CopyToNotebookAction;
