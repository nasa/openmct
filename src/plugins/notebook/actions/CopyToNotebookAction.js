/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
