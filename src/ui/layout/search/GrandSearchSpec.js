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

import mount from 'utils/mount';
import { createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';

import ExampleTagsPlugin from '../../../../example/exampleTags/plugin';
import DisplayLayoutPlugin from '../../../plugins/displayLayout/plugin';
import GrandSearch from './GrandSearch.vue';

describe('GrandSearch', () => {
  let openmct;
  let grandSearchComponent;
  let viewContainer;
  let parent;
  let sharedWorkerToRestore;
  let mockDomainObject;
  let mockAnnotationObject;
  let mockDisplayLayout;
  let mockFolderObject;
  let mockAnotherFolderObject;
  let mockTopObject;
  let originalRouterPath;
  let mockNewObject;
  let mockObjectProvider;
  let _destroy;

  beforeEach((done) => {
    openmct = createOpenMct();
    originalRouterPath = openmct.router.path;
    openmct.router.path = [mockDisplayLayout];
    openmct.editor.edit();

    openmct.install(new ExampleTagsPlugin());
    openmct.install(new DisplayLayoutPlugin());
    const availableTags = openmct.annotation.getAvailableTags();
    mockDomainObject = {
      type: 'notebook',
      name: 'fooRabbitNotebook',
      location: 'fooNameSpace:topObject',
      identifier: {
        key: 'some-object',
        namespace: 'fooNameSpace'
      },
      configuration: {
        entries: {
          someSection: {
            somePage: [
              {
                id: 'fooBarEntry',
                text: 'Foo Bar Text'
              }
            ]
          }
        }
      }
    };
    mockTopObject = {
      type: 'root',
      name: 'Top Folder',
      composition: [],
      identifier: {
        key: 'topObject',
        namespace: 'fooNameSpace'
      }
    };
    mockAnotherFolderObject = {
      type: 'folder',
      name: 'Another Test Folder',
      composition: [],
      location: 'fooNameSpace:topObject',
      identifier: {
        key: 'someParent',
        namespace: 'fooNameSpace'
      }
    };
    mockFolderObject = {
      type: 'folder',
      name: 'Test Folder',
      composition: [],
      location: 'fooNameSpace:someParent',
      identifier: {
        key: 'someFolder',
        namespace: 'fooNameSpace'
      }
    };
    mockDisplayLayout = {
      type: 'layout',
      name: 'Bar Layout',
      composition: [],
      identifier: {
        key: 'some-layout',
        namespace: 'fooNameSpace'
      },
      configuration: {
        items: [],
        layoutGrid: [10, 10]
      }
    };
    mockAnnotationObject = {
      type: 'annotation',
      name: 'Some Notebook Annotation',
      annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
      tags: [availableTags[0].id, availableTags[1].id],
      identifier: {
        key: 'anAnnotationKey',
        namespace: 'fooNameSpace'
      },
      targets: {
        'fooNameSpace:some-object': {
          entryId: 'fooBarEntry'
        }
      }
    };
    mockNewObject = {
      type: 'folder',
      name: 'New Apple Test Folder',
      composition: [],
      location: 'fooNameSpace:topObject',
      identifier: {
        key: 'newApple',
        namespace: 'fooNameSpace'
      }
    };

    openmct.router.isNavigatedObject = jasmine.createSpy().and.returnValue(false);
    mockObjectProvider = jasmine.createSpyObj('mock object provider', ['create', 'update', 'get']);
    // eslint-disable-next-line require-await
    mockObjectProvider.get = async (identifier) => {
      if (identifier.key === mockDomainObject.identifier.key) {
        return mockDomainObject;
      } else if (identifier.key === mockAnnotationObject.identifier.key) {
        return mockAnnotationObject;
      } else if (identifier.key === mockDisplayLayout.identifier.key) {
        return mockDisplayLayout;
      } else if (identifier.key === mockFolderObject.identifier.key) {
        return mockFolderObject;
      } else if (identifier.key === mockAnotherFolderObject.identifier.key) {
        return mockAnotherFolderObject;
      } else if (identifier.key === mockTopObject.identifier.key) {
        return mockTopObject;
      } else if (identifier.key === mockNewObject.identifier.key) {
        return mockNewObject;
      } else {
        return null;
      }
    };

    mockObjectProvider.create.and.returnValue(Promise.resolve(true));
    mockObjectProvider.update.and.returnValue(Promise.resolve(true));

    openmct.objects.addProvider('fooNameSpace', mockObjectProvider);

    const mockViewProvider = jasmine.createSpyObj('mock view provider', ['key', 'view', 'canView']);

    openmct.objectViews.addProvider(mockViewProvider);

    openmct.on('start', async () => {
      // use local worker
      sharedWorkerToRestore = openmct.objects.inMemorySearchProvider.worker;
      openmct.objects.inMemorySearchProvider.worker = null;
      await openmct.objects.inMemorySearchProvider.index(mockTopObject);
      await openmct.objects.inMemorySearchProvider.index(mockDomainObject);
      await openmct.objects.inMemorySearchProvider.index(mockDisplayLayout);
      await openmct.objects.inMemorySearchProvider.index(mockFolderObject);
      await openmct.objects.inMemorySearchProvider.index(mockAnnotationObject);
      parent = document.createElement('div');
      document.body.appendChild(parent);
      viewContainer = document.createElement('div');
      parent.append(viewContainer);
      const { vNode, destroy } = mount(
        {
          components: {
            GrandSearch
          },
          provide: {
            openmct
          },
          template: '<GrandSearch/>'
        },
        {
          element: viewContainer
        }
      );
      grandSearchComponent = vNode.componentInstance;
      _destroy = destroy;
      await Vue.nextTick();
      done();
    });
    openmct.startHeadless();
  });

  afterEach(() => {
    openmct.objects.inMemorySearchProvider.worker = sharedWorkerToRestore;
    openmct.router.path = originalRouterPath;
    _destroy();

    return resetApplicationState(openmct);
  });

  it('should render an object search result', async () => {
    await grandSearchComponent.$children[0].searchEverything('foo');
    await Vue.nextTick();
    const searchResults = document.querySelectorAll(
      '[aria-label="fooRabbitNotebook notebook result"]'
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].innerText).toContain('Rabbit');
  });

  it('should render an object search result if new object added', async () => {
    const composition = openmct.composition.get(mockFolderObject);
    composition.add(mockNewObject);
    // after adding, need to wait a beat for the folder to be indexed
    await Vue.nextTick();
    await grandSearchComponent.$children[0].searchEverything('apple');
    await Vue.nextTick();
    const searchResults = document.querySelectorAll(
      '[aria-label="New Apple Test Folder folder result"]'
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].innerText).toContain('Apple');
  });

  it('should not use InMemorySearch provider if object provider provides search', async () => {
    // eslint-disable-next-line require-await
    mockObjectProvider.search = async (query, abortSignal, searchType) => {
      if (searchType === openmct.objects.SEARCH_TYPES.OBJECTS) {
        return mockNewObject;
      } else {
        return [];
      }
    };

    mockObjectProvider.supportsSearchType = (someType) => {
      return true;
    };

    const composition = openmct.composition.get(mockFolderObject);
    composition.add(mockNewObject);
    await grandSearchComponent.$children[0].searchEverything('apple');
    await Vue.nextTick();
    const searchResults = document.querySelectorAll(
      '[aria-label="New Apple Test Folder folder result"]'
    );
    // This will be of length 2 (doubles) if we're incorrectly searching with InMemorySearchProvider as well
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].innerText).toContain('Apple');
  });

  it('should render an annotation search result', async () => {
    await grandSearchComponent.$children[0].searchEverything('S');
    await Vue.nextTick();
    const annotationResults = document.querySelectorAll('[aria-label="Search Result"]');
    expect(annotationResults.length).toBe(2);
    expect(annotationResults[1].innerText).toContain('Driving');
  });

  it('should render no annotation search results if no match', async () => {
    await grandSearchComponent.$children[0].searchEverything('Qbert');
    await Vue.nextTick();
    const annotationResults = document.querySelectorAll('[aria-label="Search Result"]');
    expect(annotationResults.length).toBe(0);
  });

  it('should preview object search results in edit mode if object clicked', async () => {
    await grandSearchComponent.$children[0].searchEverything('Folder');
    grandSearchComponent.$children[0].openmct.router.path = [mockDisplayLayout];
    await Vue.nextTick();
    const searchResults = document.querySelectorAll('[name="Test Folder"]');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].innerText).toContain('Folder');
    searchResults[0].click();
    const previewWindow = document.querySelector('.js-preview-window');
    expect(previewWindow.innerText).toContain('Snapshot');
  });

  it('should preview annotation search results in edit mode if annotation clicked', async () => {
    await grandSearchComponent.$children[0].searchEverything('Dri');
    grandSearchComponent.$children[0].openmct.router.path = [mockDisplayLayout];
    await Vue.nextTick();
    const annotationResults = document.querySelectorAll('[aria-label="Search Result"]');
    expect(annotationResults.length).toBe(1);
    expect(annotationResults[0].innerText).toContain('Driving');
    annotationResults[0].click();
    const previewWindow = document.querySelector('.js-preview-window');
    expect(previewWindow.innerText).toContain('Snapshot');
  });
});
