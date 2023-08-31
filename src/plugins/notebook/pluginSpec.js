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

import { createMouseEvent, createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';

import { NotebookPlugin } from './plugin';

describe('Notebook plugin:', () => {
  let openmct;
  let notebookDefinition;
  let element;
  let child;
  let appHolder;
  let objectProviderObserver;

  let notebookDomainObject;
  let originalAnnotations;

  beforeEach((done) => {
    notebookDomainObject = {
      identifier: {
        key: 'notebook',
        namespace: 'test-namespace'
      },
      type: 'notebook'
    };

    appHolder = document.createElement('div');
    appHolder.style.width = '640px';
    appHolder.style.height = '480px';
    document.body.appendChild(appHolder);

    openmct = createOpenMct();

    element = document.createElement('div');
    child = document.createElement('div');
    element.appendChild(child);

    openmct.install(NotebookPlugin());
    originalAnnotations = openmct.annotation.getNotebookAnnotation;
    // eslint-disable-next-line require-await
    openmct.annotation.getNotebookAnnotation = async function () {
      return null;
    };

    notebookDefinition = openmct.types.get('notebook').definition;
    notebookDefinition.initialize(notebookDomainObject);

    openmct.on('start', done);
    openmct.start(appHolder);
  });

  afterEach(() => {
    appHolder.remove();
    openmct.annotation.getNotebookAnnotation = originalAnnotations;

    return resetApplicationState(openmct);
  });

  it('has type as Notebook', () => {
    expect(notebookDefinition.name).toEqual('Notebook');
  });

  it('is creatable', () => {
    expect(notebookDefinition.creatable).toEqual(true);
  });

  describe('Notebook view:', () => {
    let notebookViewProvider;
    let notebookView;
    let notebookViewObject;
    let mutableNotebookObject;

    beforeEach(async () => {
      notebookViewObject = {
        ...notebookDomainObject,
        id: 'test-object',
        name: 'Notebook',
        configuration: {
          defaultSort: 'oldest',
          entries: {
            'test-section-1': {
              'test-page-1': [
                {
                  id: 'entry-0',
                  createdOn: 0,
                  text: 'First Test Entry',
                  embeds: []
                },
                {
                  id: 'entry-1',
                  createdOn: 0,
                  text: 'Second Test Entry',
                  embeds: []
                }
              ]
            }
          },
          pageTitle: 'Page',
          sections: [
            {
              id: 'test-section-1',
              isDefault: false,
              isSelected: false,
              name: 'Test Section',
              pages: [
                {
                  id: 'test-page-1',
                  isDefault: false,
                  isSelected: false,
                  name: 'Test Page 1',
                  pageTitle: 'Page'
                },
                {
                  id: 'test-page-2',
                  isDefault: false,
                  isSelected: false,
                  name: 'Test Page 2',
                  pageTitle: 'Page'
                }
              ]
            },
            {
              id: 'test-section-2',
              isDefault: false,
              isSelected: false,
              name: 'Test Section 2',
              pages: [
                {
                  id: 'test-page-3',
                  isDefault: false,
                  isSelected: false,
                  name: 'Test Page 3',
                  pageTitle: 'Page'
                }
              ]
            }
          ],
          sectionTitle: 'Section',
          type: 'General'
        }
      };
      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(notebookViewObject, [notebookViewObject]);
      notebookViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === 'notebook-vue'
      );

      testObjectProvider.get.and.returnValue(Promise.resolve(notebookViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(notebookViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      const mutableObject = await openmct.objects.getMutable(notebookViewObject.identifier);
      mutableNotebookObject = mutableObject;
      objectProviderObserver = testObjectProvider.observe.calls.mostRecent().args[1];

      notebookView = notebookViewProvider.view(mutableNotebookObject, [mutableNotebookObject]);
      notebookView.show(child);

      await Vue.nextTick();
    });

    afterEach(() => {
      notebookView.destroy();
      openmct.objects.destroyMutable(mutableNotebookObject);
    });

    it('provides notebook view', () => {
      expect(notebookViewProvider).toBeDefined();
    });

    it('renders notebook element', () => {
      const notebookElement = element.querySelectorAll('.c-notebook');
      expect(notebookElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const notebookElement = element.querySelector('.c-notebook');
      const searchElement = notebookElement.querySelector('.c-search');
      const sidebarElement = notebookElement.querySelector('.c-sidebar');
      const pageViewElement = notebookElement.querySelector('.c-notebook__page-view');
      const hasMajorElements = Boolean(searchElement && sidebarElement && pageViewElement);

      expect(hasMajorElements).toBe(true);
    });

    it('renders a row for each entry', () => {
      const notebookEntryElements = element.querySelectorAll('.c-notebook__entry');
      const firstEntryText = getEntryText(0);
      expect(notebookEntryElements.length).toBe(2);
      expect(firstEntryText.innerText).toBe('First Test Entry');
    });

    describe('synchronization', () => {
      let objectCloneToSyncFrom;

      beforeEach(() => {
        objectCloneToSyncFrom = structuredClone(notebookViewObject);
        objectCloneToSyncFrom.persisted = notebookViewObject.modified + 1;
      });

      it('updates an entry when another user modifies it', () => {
        expect(getEntryText(0).innerText).toBe('First Test Entry');
        objectCloneToSyncFrom.configuration.entries['test-section-1']['test-page-1'][0].text =
          'Modified entry text';
        objectProviderObserver(objectCloneToSyncFrom);

        return Vue.nextTick().then(() => {
          expect(getEntryText(0).innerText).toBe('Modified entry text');
        });
      });

      it('shows new entry when another user adds one', () => {
        expect(allNotebookEntryElements().length).toBe(2);
        objectCloneToSyncFrom.configuration.entries['test-section-1']['test-page-1'].push({
          id: 'entry-3',
          createdOn: 0,
          text: 'Third Test Entry',
          embeds: []
        });
        objectProviderObserver(objectCloneToSyncFrom);

        return Vue.nextTick().then(() => {
          expect(allNotebookEntryElements().length).toBe(3);
        });
      });
      it('removes an entry when another user removes one', () => {
        expect(allNotebookEntryElements().length).toBe(2);
        let entries = objectCloneToSyncFrom.configuration.entries['test-section-1']['test-page-1'];
        objectCloneToSyncFrom.configuration.entries['test-section-1']['test-page-1'] =
          entries.splice(0, 1);
        objectProviderObserver(objectCloneToSyncFrom);

        return Vue.nextTick().then(() => {
          expect(allNotebookEntryElements().length).toBe(1);
        });
      });

      xit('updates the notebook when a user adds a page', async () => {
        const newPage = {
          id: 'test-page-4',
          isDefault: false,
          isSelected: false,
          name: 'Test Page 4',
          pageTitle: 'Page'
        };

        expect(allNotebookPageElements().length).toBe(2);
        objectCloneToSyncFrom.configuration.sections[0].pages.push(newPage);
        objectProviderObserver(objectCloneToSyncFrom);

        await Vue.nextTick();
        expect(allNotebookPageElements().length).toBe(3);
      });

      xit('updates the notebook when a user removes a page', async () => {
        expect(allNotebookPageElements().length).toBe(2);
        objectCloneToSyncFrom.configuration.sections[0].pages.splice(0, 1);
        objectProviderObserver(objectCloneToSyncFrom);

        await Vue.nextTick();
        expect(allNotebookPageElements().length).toBe(1);
      });

      xit('updates the notebook when a user adds a section', () => {
        const newSection = {
          id: 'test-section-3',
          isDefault: false,
          isSelected: false,
          name: 'Test Section 3',
          pages: [
            {
              id: 'test-page-4',
              isDefault: false,
              isSelected: false,
              name: 'Test Page 4',
              pageTitle: 'Page'
            }
          ]
        };

        expect(allNotebookSectionElements().length).toBe(2);
        objectCloneToSyncFrom.configuration.sections.push(newSection);
        objectProviderObserver(objectCloneToSyncFrom);

        return Vue.nextTick().then(() => {
          expect(allNotebookSectionElements().length).toBe(3);
        });
      });

      xit('updates the notebook when a user removes a section', () => {
        expect(allNotebookSectionElements().length).toBe(2);
        objectCloneToSyncFrom.configuration.sections.splice(0, 1);
        objectProviderObserver(objectCloneToSyncFrom);

        return Vue.nextTick().then(() => {
          expect(allNotebookSectionElements().length).toBe(1);
        });
      });
    });
  });

  describe('Notebook Snapshots view:', () => {
    let snapshotIndicator;
    let drawerElement;

    function clickSnapshotIndicator() {
      const indicator = element.querySelector('.icon-camera');
      const button = indicator.querySelector('button');
      const clickEvent = createMouseEvent('click');

      button.dispatchEvent(clickEvent);
    }

    beforeEach(() => {
      snapshotIndicator = openmct.indicators.indicatorObjects.find(
        (indicator) => indicator.key === 'notebook-snapshot-indicator'
      ).element;

      element.append(snapshotIndicator);

      return Vue.nextTick().then(() => {
        drawerElement = document.querySelector('.l-shell__drawer');
      });
    });

    afterEach(() => {
      if (drawerElement) {
        drawerElement.classList.remove('is-expanded');
      }

      snapshotIndicator.remove();
      snapshotIndicator = undefined;

      if (drawerElement) {
        drawerElement.remove();
        drawerElement = undefined;
      }
    });

    it('has Snapshots indicator', () => {
      const hasSnapshotIndicator = snapshotIndicator !== null && snapshotIndicator !== undefined;
      expect(hasSnapshotIndicator).toBe(true);
    });

    it('snapshots container has class isExpanded', () => {
      let classes = drawerElement.classList;
      const isExpandedBefore = classes.contains('is-expanded');

      clickSnapshotIndicator();
      classes = drawerElement.classList;
      const isExpandedAfterFirstClick = classes.contains('is-expanded');

      expect(isExpandedBefore).toBeFalse();
      expect(isExpandedAfterFirstClick).toBeTrue();
    });

    it('snapshots container does not have class isExpanded', () => {
      let classes = drawerElement.classList;
      const isExpandedBefore = classes.contains('is-expanded');

      clickSnapshotIndicator();
      classes = drawerElement.classList;
      const isExpandedAfterFirstClick = classes.contains('is-expanded');

      clickSnapshotIndicator();
      classes = drawerElement.classList;
      const isExpandedAfterSecondClick = classes.contains('is-expanded');

      expect(isExpandedBefore).toBeFalse();
      expect(isExpandedAfterFirstClick).toBeTrue();
      expect(isExpandedAfterSecondClick).toBeFalse();
    });

    it('show notebook snapshots container text', () => {
      clickSnapshotIndicator();

      const notebookSnapshots = drawerElement.querySelector('.l-browse-bar__object-name');
      const snapshotsText = notebookSnapshots.textContent.trim();

      expect(snapshotsText).toBe('Notebook Snapshots');
    });
  });

  function getEntryText(entryNumber) {
    return element.querySelectorAll('.c-notebook__entry .c-ne__text')[entryNumber];
  }

  function allNotebookEntryElements() {
    return element.querySelectorAll('.c-notebook__entry');
  }

  function allNotebookSectionElements() {
    return element.querySelectorAll('.js-sidebar-sections .js-list__item');
  }

  function allNotebookPageElements() {
    return element.querySelectorAll('.js-sidebar-pages .js-list__item');
  }
});
