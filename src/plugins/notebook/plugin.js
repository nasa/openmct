/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import CopyToNotebookAction from './actions/CopyToNotebookAction';
import ExportNotebookAsTextAction from './actions/ExportNotebookAsTextAction';
import NotebookSnapshotIndicator from './components/NotebookSnapshotIndicator.vue';
import NotebookViewProvider from './NotebookViewProvider';
import NotebookType from './NotebookType';
import SnapshotContainer from './snapshot-container';
import monkeyPatchObjectAPIForNotebooks from './monkeyPatchObjectAPIForNotebooks.js';

import { notebookImageMigration } from '../notebook/utils/notebook-migration';
import {
  NOTEBOOK_TYPE,
  RESTRICTED_NOTEBOOK_TYPE,
  NOTEBOOK_VIEW_TYPE,
  RESTRICTED_NOTEBOOK_VIEW_TYPE,
  NOTEBOOK_BASE_INSTALLED
} from './notebook-constants';

import Vue from 'vue';

let notebookSnapshotContainer;
function getSnapshotContainer(openmct) {
  if (!notebookSnapshotContainer) {
    notebookSnapshotContainer = new SnapshotContainer(openmct);
  }

  return notebookSnapshotContainer;
}

function addLegacyNotebookGetInterceptor(openmct) {
  openmct.objects.addGetInterceptor({
    appliesTo: (identifier, domainObject) => {
      return domainObject && domainObject.type === NOTEBOOK_TYPE;
    },
    invoke: (identifier, domainObject) => {
      notebookImageMigration(openmct, domainObject);

      return domainObject;
    }
  });
}

function installBaseNotebookFunctionality(openmct) {
  // only need to do this once
  if (openmct[NOTEBOOK_BASE_INSTALLED]) {
    return;
  }

  const snapshotContainer = getSnapshotContainer(openmct);
  const notebookSnapshotImageType = {
    name: 'Notebook Snapshot Image Storage',
    description: 'Notebook Snapshot Image Storage object',
    creatable: false,
    initialize: (domainObject) => {
      domainObject.configuration = {
        fullSizeImageURL: undefined,
        thumbnailImageURL: undefined
      };
    }
  };
  openmct.types.addType('notebookSnapshotImage', notebookSnapshotImageType);
  openmct.actions.register(new CopyToNotebookAction(openmct));
  openmct.actions.register(new ExportNotebookAsTextAction(openmct));

  const notebookSnapshotIndicator = new Vue({
    components: {
      NotebookSnapshotIndicator
    },
    provide: {
      openmct,
      snapshotContainer
    },
    template: '<NotebookSnapshotIndicator></NotebookSnapshotIndicator>'
  });
  const indicator = {
    element: notebookSnapshotIndicator.$mount().$el,
    key: 'notebook-snapshot-indicator',
    priority: openmct.priority.DEFAULT
  };

  openmct.indicators.add(indicator);

  monkeyPatchObjectAPIForNotebooks(openmct);

  openmct[NOTEBOOK_BASE_INSTALLED] = true;
}

function NotebookPlugin(name = 'Notebook', entryUrlWhitelist = []) {
  return function install(openmct) {
    const icon = 'icon-notebook';
    const description = 'Create and save timestamped notes with embedded object snapshots.';
    const snapshotContainer = getSnapshotContainer(openmct);

    addLegacyNotebookGetInterceptor(openmct);

    const notebookType = new NotebookType(name, description, icon);
    openmct.types.addType(NOTEBOOK_TYPE, notebookType);

    const notebookView = new NotebookViewProvider(
      openmct,
      name,
      NOTEBOOK_VIEW_TYPE,
      NOTEBOOK_TYPE,
      icon,
      snapshotContainer,
      entryUrlWhitelist
    );
    openmct.objectViews.addProvider(notebookView, entryUrlWhitelist);

    installBaseNotebookFunctionality(openmct);
  };
}

function RestrictedNotebookPlugin(name = 'Notebook Shift Log', entryUrlWhitelist = []) {
  return function install(openmct) {
    const icon = 'icon-notebook-shift-log';
    const description =
      'Create and save timestamped notes with embedded object snapshots with the ability to commit and lock pages.';
    const snapshotContainer = getSnapshotContainer(openmct);

    const notebookType = new NotebookType(name, description, icon);
    openmct.types.addType(RESTRICTED_NOTEBOOK_TYPE, notebookType);

    const notebookView = new NotebookViewProvider(
      openmct,
      name,
      RESTRICTED_NOTEBOOK_VIEW_TYPE,
      RESTRICTED_NOTEBOOK_TYPE,
      icon,
      snapshotContainer,
      entryUrlWhitelist
    );
    openmct.objectViews.addProvider(notebookView, entryUrlWhitelist);

    installBaseNotebookFunctionality(openmct);
  };
}

export { NotebookPlugin, RestrictedNotebookPlugin };
