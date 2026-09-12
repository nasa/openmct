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

import mount from 'utils/mount';
import { createOpenMct, resetApplicationState } from 'utils/testing';
import { nextTick } from 'vue';

import ExampleTagsPlugin from '../../../../example/exampleTags/plugin.js';
import DisplayLayoutPlugin from '../../../plugins/displayLayout/plugin.js';
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
      targets: [
        {
          keyString: 'fooNameSpace:some-object',
          entryId: 'fooBarEntry'
        }
      ]
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
    mockObjectProvider = jasmine.createSpyObj('mock object provider', [
      'create',
      'update',
      'get',
      'supportsSearchType',
      'search'
    ]);
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
          template: '<GrandSearch ref="root"/>'
        },
        {
          element: viewContainer
        }
      );
      grandSearchComponent = vNode.componentInstance;
      _destroy = destroy;
      await nextTick();
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
    await grandSearchComponent.$refs.root.searchEverything('foo');
    await nextTick();
    const searchResults = document.querySelectorAll(
      '[aria-label="fooRabbitNotebook notebook result"]'
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].innerText).toContain('Rabbit');
  });

  it('should remove an object search result when its location is cleared', async () => {
    await grandSearchComponent.$refs.root.searchEverything('foo');
    await nextTick();

    openmct.objects.mutate(mockDomainObject, 'location', null);
    await nextTick();

    const searchResults = document.querySelectorAll(
      '[aria-label="fooRabbitNotebook notebook result"]'
    );
    expect(searchResults.length).toBe(0);
    expect(document.body.innerText).toContain('No results found');
  });

  it('should evict descendants but keep unrelated results when a parent is removed', async () => {
    const search = grandSearchComponent.$refs.root;
    await search.searchEverything('Folder');
    await nextTick();
    expect(
      search.objectSearchResults.some((result) => result.name === mockFolderObject.name)
    ).toBeTrue();

    openmct.objects.mutate(mockAnotherFolderObject, 'location', null);
    await nextTick();

    expect(mockFolderObject.location).toBe('fooNameSpace:someParent');
    expect(
      search.objectSearchResults.some((result) => result.name === mockFolderObject.name)
    ).toBeFalse();
    expect(
      search.objectSearchResults.some((result) => result.name === mockTopObject.name)
    ).toBeTrue();
    expect(document.querySelector('[name="Test Folder"]')).toBeNull();
  });

  it('should not add per-result location observers or duplicate mutation listeners', async () => {
    const search = grandSearchComponent.$refs.root;
    const emitter = openmct.objects.eventEmitter;
    const listenerCount = emitter
      .listeners('mutation')
      .filter((listener) => listener === search.onSearchObjectMutation).length;
    spyOn(openmct.objects, 'observe').and.callThrough();
    await search.searchEverything('Folder');
    await search.searchEverything('foo');

    expect(listenerCount).toBe(1);
    expect(
      emitter.listeners('mutation').filter((listener) => listener === search.onSearchObjectMutation)
        .length
    ).toBe(1);
    expect(
      openmct.objects.observe.calls.allArgs().some((args) => args[1] === 'location')
    ).toBeFalse();
  });

  it('should not reopen dismissed search results when an object is removed', async () => {
    const search = grandSearchComponent.$refs.root;
    await search.searchEverything('foo');
    search.$refs.searchResultsDropDown.resultsShown = false;
    openmct.objects.mutate(mockDomainObject, 'location', null);
    await nextTick();

    expect(search.$refs.searchResultsDropDown.resultsShown).toBeFalse();
    expect(search.$refs.searchResultsDropDown.objectResults).toEqual([]);
  });

  it('should evict a soft-deleted annotation without changing the query', async () => {
    const search = grandSearchComponent.$refs.root;
    await search.searchEverything('Dri');
    expect(search.annotationSearchResults.length).toBe(1);
    openmct.objects.mutate(mockAnnotationObject, '_deleted', true);
    await nextTick();
    expect(search.annotationSearchResults).toEqual([]);
    expect(document.querySelector('[aria-label="Annotation Search Result"]')).toBeNull();
  });

  it('should evict annotations when their target or its ancestor is removed', async () => {
    const search = grandSearchComponent.$refs.root;
    await search.searchEverything('Dri');
    expect(search.annotationSearchResults.length).toBe(1);
    openmct.objects.mutate(mockTopObject, 'location', null);
    await nextTick();
    expect(search.annotationSearchResults).toEqual([]);
    expect(search.$refs.searchResultsDropDown.annotationResults).toEqual([]);
  });

  it('should preserve other annotations combined into the same result', async () => {
    const secondAnnotation = {
      ...mockAnnotationObject,
      identifier: { namespace: 'fooNameSpace', key: 'secondAnnotation' }
    };
    spyOn(openmct.objects, 'search').and.returnValue([
      Promise.resolve([mockAnnotationObject, secondAnnotation])
    ]);
    const search = grandSearchComponent.$refs.root;
    await search.searchEverything('Dri');
    expect(search.annotationSearchResults.length).toBe(1);
    expect(search.annotationSearchResults[0].annotationSources.length).toBe(2);
    openmct.objects.mutate(mockAnnotationObject, '_deleted', true);
    await nextTick();
    expect(search.annotationSearchResults.length).toBe(1);
    expect(search.annotationSearchResults[0].fullTagModels.length).toBeGreaterThan(0);
    openmct.objects.mutate(secondAnnotation, '_deleted', true);
    expect(search.annotationSearchResults).toEqual([]);
  });

  it('should evict an object after a wildcard refresh', async () => {
    const search = grandSearchComponent.$refs.root;
    await search.searchEverything('foo');
    const mutable = openmct.objects.toMutable(mockDomainObject);
    mutable.$refresh({ ...mockDomainObject, location: null });
    openmct.objects.destroyMutable(mutable);
    expect(search.objectSearchResults).toEqual([]);
  });

  it('should fetch remote changes only for current results and ancestors', async () => {
    const search = grandSearchComponent.$refs.root;
    await search.searchEverything('Folder');
    spyOn(openmct.objects, 'get').and.resolveTo({ ...mockAnotherFolderObject, location: null });
    await search.onRemoteSearchObjectChange(mockAnnotationObject.identifier);
    expect(openmct.objects.get).not.toHaveBeenCalled();
    await search.onRemoteSearchObjectChange(mockAnotherFolderObject.identifier);
    expect(openmct.objects.get).toHaveBeenCalledWith(
      mockAnotherFolderObject.identifier,
      search.resultController.signal,
      true
    );
    expect(
      search.objectSearchResults.some((result) => result.name === mockFolderObject.name)
    ).toBeFalse();
  });

  describe('canceled searches', () => {
    let search;

    function deferred() {
      let resolve;
      const promise = new Promise((resolvePromise) => {
        resolve = resolvePromise;
      });

      return { promise, resolve };
    }

    beforeEach(() => {
      search = grandSearchComponent.$refs.root;
      // Control completion explicitly instead of waiting for the input debounce.
      search.getSearchResults = GrandSearch.methods.getSearchResults.bind(search);
      spyOn(openmct.annotation, 'searchForTags').and.resolveTo([]);
      spyOn(search, 'showSearchResults');
    });

    it('should ignore stale paths and annotations without finishing the current search', async () => {
      const oldPaths = deferred();
      const pathsStarted = deferred();
      const oldAnnotations = deferred();
      const newBatch = deferred();
      spyOn(openmct.objects, 'search').and.returnValues(
        [Promise.resolve([mockDomainObject])],
        [newBatch.promise]
      );
      openmct.annotation.searchForTags.and.returnValues(
        oldAnnotations.promise,
        Promise.resolve([])
      );
      const getPaths = search.getPathsForObjects.bind(search);
      spyOn(search, 'getPathsForObjects').and.callFake((objects, signal) => {
        if (objects[0] === mockDomainObject) {
          pathsStarted.resolve();

          return oldPaths.promise;
        }

        return getPaths(objects, signal);
      });
      const oldSearch = search.searchEverything('foo');
      await pathsStarted.promise;
      const oldController = search.abortSearchController;
      const newSearch = search.searchEverything('apple');
      const newController = search.abortSearchController;
      expect(oldController.signal.aborted).toBeTrue();

      oldPaths.resolve([{ ...mockDomainObject, objectPath: [mockDomainObject, mockTopObject] }]);
      oldAnnotations.resolve([mockAnnotationObject]);
      await oldSearch;

      expect(search.objectSearchResults).toEqual([]);
      expect(search.annotationSearchResults).toEqual([]);
      expect(search.abortSearchController).toBe(newController);
      expect(search.searchLoading).toBeTrue();

      newBatch.resolve([mockNewObject]);
      await newSearch;
      expect(search.objectSearchResults.map((result) => result.name)).toEqual([mockNewObject.name]);
      expect(search.searchLoading).toBeFalse();
    });

    it('should ignore a provider batch that arrives after the query is cleared', async () => {
      const batch = deferred();
      spyOn(openmct.objects, 'search').and.returnValue([batch.promise]);
      spyOn(search, 'getPathsForObjects').and.callThrough();
      const pendingSearch = search.searchEverything('foo');
      await search.searchEverything('');
      batch.resolve([mockDomainObject]);
      await pendingSearch;

      expect(search.getPathsForObjects).not.toHaveBeenCalled();
      expect(search.objectSearchResults).toEqual([]);
      expect(search.searchLoading).toBeFalse();
      expect(search.$refs.searchResultsDropDown.resultsShown).toBeFalse();
    });

    it('should abort on unmount and ignore paths and annotations that resolve afterward', async () => {
      const paths = deferred();
      const pathsStarted = deferred();
      const annotations = deferred();
      spyOn(openmct.objects, 'search').and.returnValue([Promise.resolve([mockDomainObject])]);
      spyOn(search, 'getPathsForObjects').and.callFake(() => {
        pathsStarted.resolve();

        return paths.promise;
      });
      openmct.annotation.searchForTags.and.returnValue(annotations.promise);
      const pendingSearch = search.searchEverything('foo');
      await pathsStarted.promise;
      const controller = search.abortSearchController;
      _destroy();
      _destroy = () => {};
      expect(controller.signal.aborted).toBeTrue();

      paths.resolve([{ ...mockDomainObject, objectPath: [mockDomainObject, mockTopObject] }]);
      annotations.resolve([mockAnnotationObject]);
      await pendingSearch;

      expect(search.showSearchResults).not.toHaveBeenCalled();
      expect(search.objectSearchResults).toEqual([]);
      expect(search.annotationSearchResults).toEqual([]);
      expect(openmct.objects.eventEmitter.listeners('mutation')).not.toContain(
        search.onSearchObjectMutation
      );
      expect(openmct.objects.eventEmitter.listeners('refresh')).not.toContain(
        search.onSearchObjectRefresh
      );
      expect(openmct.objects.eventEmitter.listeners('remoteChange')).not.toContain(
        search.onRemoteSearchObjectChange
      );
    });

    it('should remove the global mutation listener on unmount', async () => {
      await search.searchEverything('foo');
      _destroy();
      _destroy = () => {};

      expect(openmct.objects.eventEmitter.listeners('mutation')).not.toContain(
        search.onSearchObjectMutation
      );
      expect(openmct.objects.eventEmitter.listeners('refresh')).not.toContain(
        search.onSearchObjectRefresh
      );
      expect(openmct.objects.eventEmitter.listeners('remoteChange')).not.toContain(
        search.onRemoteSearchObjectChange
      );
    });

    it('should ignore annotations soft-deleted while tag search is pending', async () => {
      const annotations = deferred();
      openmct.annotation.searchForTags.and.returnValue(annotations.promise);
      const pendingSearch = search.searchEverything('Dri');
      openmct.objects.mutate(mockAnnotationObject, '_deleted', true);
      annotations.resolve([{ ...mockAnnotationObject, _deleted: false }]);
      await pendingSearch;
      expect(search.annotationSearchResults).toEqual([]);
    });

    it('should cancel a remote lookup when the query is replaced', async () => {
      await search.searchEverything('foo');
      const remote = deferred();
      spyOn(openmct.objects, 'get').and.returnValue(remote.promise);
      const pendingRemote = search.onRemoteSearchObjectChange(mockDomainObject.identifier);
      const signal = search.resultController.signal;
      await search.searchEverything('');
      remote.resolve({ ...mockDomainObject, location: null });
      await pendingRemote;
      expect(signal.aborted).toBeTrue();
      expect(search.deletedSearchObjectKeys.size).toBe(0);
    });

    it('should reject a descendant whose ancestor was deleted during path lookup', async () => {
      const paths = deferred();
      const started = deferred();
      spyOn(openmct.objects, 'search').and.returnValue([Promise.resolve([mockFolderObject])]);
      spyOn(search, 'getPathsForObjects').and.callFake(() => {
        started.resolve();

        return paths.promise;
      });
      const pendingSearch = search.searchEverything('Folder');
      await started.promise;
      const oldParent = { ...mockAnotherFolderObject };
      openmct.objects.mutate(mockAnotherFolderObject, 'location', null);
      paths.resolve([
        { ...mockFolderObject, objectPath: [mockFolderObject, oldParent, mockTopObject] }
      ]);
      await pendingSearch;

      expect(search.objectSearchResults).toEqual([]);
    });
  });

  it('should cancel a debounced search when unmounted', () => {
    jasmine.clock().install();
    try {
      const search = grandSearchComponent.$refs.root;
      const getSearchResults = jasmine.createSpy('getSearchResults').and.resolveTo();
      search.getSearchResults = search.debounceAsyncFunction(getSearchResults, 200);
      search.searchEverything('foo');
      _destroy();
      _destroy = () => {};
      jasmine.clock().tick(201);

      expect(getSearchResults).not.toHaveBeenCalled();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('should render an object search result if new object added', async () => {
    delete mockObjectProvider.supportsSearchType;
    delete mockObjectProvider.search;
    const composition = openmct.composition.get(mockFolderObject);
    composition.add(mockNewObject);
    // after adding, need to wait a beat for the folder to be indexed
    await nextTick();
    await grandSearchComponent.$refs.root.searchEverything('apple');
    await nextTick();
    const searchResults = document.querySelectorAll(
      '[aria-label="New Apple Test Folder folder result"]'
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].innerText).toContain('Apple');
  });

  it('should not use InMemorySearch provider if object provider provides search', async () => {
    // eslint-disable-next-line require-await
    mockObjectProvider.search.and.callFake((query, abortSignal, searchType) => {
      if (searchType === openmct.objects.SEARCH_TYPES.OBJECTS) {
        return [mockNewObject];
      } else {
        return [];
      }
    });

    mockObjectProvider.supportsSearchType.and.callFake((someType) => {
      return true;
    });

    const composition = openmct.composition.get(mockFolderObject);
    composition.add(mockNewObject);
    await grandSearchComponent.$refs.root.searchEverything('apple');
    await nextTick();
    const searchResults = document.querySelectorAll(
      '[aria-label="New Apple Test Folder folder result"]'
    );
    // This will be of length 2 (doubles) if we're incorrectly searching with InMemorySearchProvider as well
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].innerText).toContain('Apple');
  });

  it('should render an annotation search result', async () => {
    await grandSearchComponent.$refs.root.searchEverything('S');
    await nextTick();
    const annotationResults = document.querySelectorAll('[aria-label="Annotation Search Result"]');
    expect(annotationResults.length).toBe(1);
    expect(annotationResults[0].innerText).toContain('Driving');
  });

  it('should render no annotation search results if no match', async () => {
    await grandSearchComponent.$refs.root.searchEverything('Qbert');
    await nextTick();
    const annotationResults = document.querySelectorAll('[aria-label="Annotation Search Result"]');
    expect(annotationResults.length).toBe(0);
  });

  it('should preview object search results in edit mode if object clicked', async () => {
    await grandSearchComponent.$refs.root.searchEverything('Folder');
    grandSearchComponent.$refs.root.openmct.router.path = [mockDisplayLayout];
    await nextTick();
    const folderResult = document.querySelector('[name="Test Folder"]');
    expect(folderResult).not.toBeNull();
    folderResult.click();
    const previewWindow = document.querySelector('.js-preview-window');
    expect(previewWindow.innerText).toContain('Snapshot');
  });

  it('should preview annotation search results in edit mode if annotation clicked', async () => {
    await grandSearchComponent.$refs.root.searchEverything('Dri');
    grandSearchComponent.$refs.root.openmct.router.path = [mockDisplayLayout];
    await nextTick();
    const annotationResults = document.querySelectorAll('[aria-label="Annotation Search Result"]');
    expect(annotationResults.length).toBe(1);
    expect(annotationResults[0].innerText).toContain('Driving');
    annotationResults[0].click();
    const previewWindow = document.querySelector('.js-preview-window');
    expect(previewWindow.innerText).toContain('Snapshot');
  });
});
