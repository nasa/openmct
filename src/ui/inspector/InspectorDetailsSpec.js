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

import { createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';

const INSPECTOR_SELECTOR_PREFIX = '.c-inspect-properties__';

describe('the inspector', () => {
  let appHolder;
  let openmct;
  let folderItem;
  let selection;

  beforeEach((done) => {
    folderItem = {
      name: 'folder',
      type: 'folder',
      createdBy: 'John Q',
      modifiedBy: 'Public',
      id: 'mock-folder-key',
      identifier: {
        namespace: '',
        key: 'mock-folder-key'
      },
      notes: 'This object should have some notes',
      created: 1592851063871
    };

    selection = [
      {
        context: {
          item: folderItem
        }
      }
    ];

    appHolder = document.createElement('div');

    openmct = createOpenMct();
    openmct.on('start', done);
    openmct.start(appHolder);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('displays default details for selection', async () => {
    openmct.selection.select(selection);
    await Vue.nextTick();

    const details = getDetails();
    const [title, type, createdBy, modifiedBy, notes, timestamp] = details;

    expect(title.name).toEqual('Title');
    expect(title.value.toLowerCase()).toEqual(folderItem.name);

    expect(type.name).toEqual('Type');
    expect(type.value.toLowerCase()).toEqual(folderItem.type);
    expect(createdBy.name).toEqual('Created By');
    expect(createdBy.value).toEqual(folderItem.createdBy);
    expect(modifiedBy.name).toEqual('Modified By');
    expect(modifiedBy.value).toEqual(folderItem.modifiedBy);
    expect(notes.value).toEqual('This object should have some notes');

    expect(timestamp.name).toEqual('Created');
    expect(new Date(timestamp.value).toString()).toEqual(new Date(folderItem.created).toString());
  });

  it('details show modified date', async () => {
    const modifiedTimestamp = folderItem.created + 1000;
    folderItem.modified = modifiedTimestamp;

    openmct.selection.select(selection);
    await Vue.nextTick();

    const details = getDetails();
    const timestamp = details[details.length - 1];

    expect(timestamp.name).toEqual('Modified');
    expect(new Date(timestamp.value).toString()).toEqual(new Date(folderItem.modified).toString());
  });

  it('displays custom details if provided through context', async () => {
    const NAME_PREFIX = 'Custom Name';
    const VALUE_PREFIX = 'Custom Value';
    const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const customDetails = indexes.map((index) => {
      return {
        name: `${NAME_PREFIX} ${index}`,
        value: `${VALUE_PREFIX} ${index}`
      };
    });

    selection[0].context.details = customDetails;

    openmct.selection.select(selection);
    await Vue.nextTick();

    const details = getDetails();

    expect(details.length).toEqual(customDetails.length);

    details.forEach((detail, index) => {
      expect(detail.name).toEqual(customDetails[index].name);
      expect(detail.value).toEqual(customDetails[index].value);
    });
  });

  function getDetailsElements() {
    const inspectorDetailsSection = appHolder.querySelector(`${INSPECTOR_SELECTOR_PREFIX}section`);
    const details = inspectorDetailsSection.querySelectorAll(`${INSPECTOR_SELECTOR_PREFIX}row`);

    return details;
  }

  function getDetails() {
    const detailsElements = getDetailsElements();
    const details = Array.from(detailsElements).map((element) => {
      return {
        name: getText(element, 'label'),
        value: getText(element, 'value')
      };
    });

    return details;
  }

  function getText(element, selectorSuffix) {
    return element
      .querySelector(`${INSPECTOR_SELECTOR_PREFIX}${selectorSuffix}`)
      .textContent.trim();
  }
});
