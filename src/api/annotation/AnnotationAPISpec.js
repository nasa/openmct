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

import { createOpenMct, resetApplicationState } from '../../utils/testing';
import ExampleTagsPlugin from '../../../example/exampleTags/plugin';

describe('The Annotation API', () => {
  let openmct;
  let mockObjectProvider;
  let mockImmutableObjectProvider;
  let mockDomainObject;
  let mockFolderObject;
  let mockAnnotationObject;

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.install(new ExampleTagsPlugin());
    const availableTags = openmct.annotation.getAvailableTags();
    mockFolderObject = {
      type: 'root',
      name: 'folderFoo',
      location: '',
      identifier: {
        key: 'someParent',
        namespace: 'fooNameSpace'
      }
    };
    mockDomainObject = {
      type: 'notebook',
      name: 'fooRabbitNotebook',
      location: 'fooNameSpace:someParent',
      identifier: {
        key: 'some-object',
        namespace: 'fooNameSpace'
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

    mockObjectProvider = jasmine.createSpyObj('mock provider', ['create', 'update', 'get']);
    // eslint-disable-next-line require-await
    mockObjectProvider.get = async (identifier) => {
      if (identifier.key === mockDomainObject.identifier.key) {
        return mockDomainObject;
      } else if (identifier.key === mockAnnotationObject.identifier.key) {
        return mockAnnotationObject;
      } else if (identifier.key === mockFolderObject.identifier.key) {
        return mockFolderObject;
      } else {
        return null;
      }
    };

    mockObjectProvider.create.and.returnValue(Promise.resolve(true));
    mockObjectProvider.update.and.returnValue(Promise.resolve(true));

    mockImmutableObjectProvider = jasmine.createSpyObj('mock immutable provider', ['get']);
    // eslint-disable-next-line require-await
    mockImmutableObjectProvider.get = async (identifier) => {
      if (identifier.key === mockDomainObject.identifier.key) {
        return mockDomainObject;
      } else if (identifier.key === mockAnnotationObject.identifier.key) {
        return mockAnnotationObject;
      } else if (identifier.key === mockFolderObject.identifier.key) {
        return mockFolderObject;
      } else {
        return null;
      }
    };

    openmct.objects.addProvider('immutableProvider', mockImmutableObjectProvider);
    openmct.objects.addProvider('fooNameSpace', mockObjectProvider);
    openmct.on('start', done);
    openmct.startHeadless();
  });
  afterEach(async () => {
    await resetApplicationState(openmct);
  });
  it('is defined', () => {
    expect(openmct.annotation).toBeDefined();
  });

  describe('Creation', () => {
    it('can create annotations', async () => {
      const annotationCreationArguments = {
        name: 'Test Annotation',
        domainObject: mockDomainObject,
        annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
        tags: ['sometag'],
        contentText: 'fooContext',
        targetDomainObjects: [mockDomainObject],
        targets: { fooTarget: {} }
      };
      const annotationObject = await openmct.annotation.create(annotationCreationArguments);
      expect(annotationObject).toBeDefined();
      expect(annotationObject.type).toEqual('annotation');
    });
    it('can create annotations if domain object is immutable', async () => {
      mockDomainObject.identifier.namespace = 'immutableProvider';
      const annotationCreationArguments = {
        name: 'Test Annotation',
        domainObject: mockDomainObject,
        annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
        tags: ['sometag'],
        contentText: 'fooContext',
        targetDomainObjects: [mockDomainObject],
        targets: { fooTarget: {} }
      };
      openmct.annotation.setNamespaceToSaveAnnotations('fooNameSpace');
      const annotationObject = await openmct.annotation.create(annotationCreationArguments);
      expect(annotationObject).toBeDefined();
      expect(annotationObject.type).toEqual('annotation');
    });
    it('fails if annotation is an unknown type', async () => {
      try {
        await openmct.annotation.create(
          'Garbage Annotation',
          mockDomainObject,
          'garbageAnnotation',
          ['sometag'],
          'fooContext',
          { fooTarget: {} }
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    it('fails if annotation if given an immutable namespace to save to', async () => {
      try {
        const annotationCreationArguments = {
          name: 'Test Annotation',
          domainObject: mockDomainObject,
          annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
          tags: ['sometag'],
          contentText: 'fooContext',
          targetDomainObjects: [mockDomainObject],
          targets: { fooTarget: {} }
        };
        openmct.annotation.setNamespaceToSaveAnnotations('nameespaceThatDoesNotExist');
        await openmct.annotation.create(annotationCreationArguments);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    it('fails if annotation if given an undefined namespace to save to', async () => {
      try {
        const annotationCreationArguments = {
          name: 'Test Annotation',
          domainObject: mockDomainObject,
          annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
          tags: ['sometag'],
          contentText: 'fooContext',
          targetDomainObjects: [mockDomainObject],
          targets: { fooTarget: {} }
        };
        openmct.annotation.setNamespaceToSaveAnnotations('immutableProvider');
        await openmct.annotation.create(annotationCreationArguments);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Tagging', () => {
    let tagCreationArguments;
    beforeEach(() => {
      tagCreationArguments = {
        name: 'Test Annotation',
        domainObject: mockDomainObject,
        annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
        tags: ['aWonderfulTag'],
        contentText: 'fooContext',
        targets: { 'fooNameSpace:some-object': { entryId: 'fooBarEntry' } },
        targetDomainObjects: [mockDomainObject]
      };
    });
    it('can create a tag', async () => {
      const annotationObject = await openmct.annotation.create(tagCreationArguments);
      expect(annotationObject).toBeDefined();
      expect(annotationObject.type).toEqual('annotation');
      expect(annotationObject.tags).toContain('aWonderfulTag');
    });
    it('can delete a tag', async () => {
      const annotationObject = await openmct.annotation.create(tagCreationArguments);
      expect(annotationObject).toBeDefined();
      openmct.annotation.deleteAnnotations([annotationObject]);
      expect(annotationObject._deleted).toBeTrue();
    });
    it('can remove all tags', async () => {
      const annotationObject = await openmct.annotation.create(tagCreationArguments);
      expect(annotationObject).toBeDefined();
      expect(() => {
        openmct.annotation.deleteAnnotations([annotationObject]);
      }).not.toThrow();
      expect(annotationObject._deleted).toBeTrue();
    });
    it('can add/delete/add a tag', async () => {
      let annotationObject = await openmct.annotation.create(tagCreationArguments);
      expect(annotationObject).toBeDefined();
      expect(annotationObject.type).toEqual('annotation');
      expect(annotationObject.tags).toContain('aWonderfulTag');
      openmct.annotation.deleteAnnotations([annotationObject]);
      expect(annotationObject._deleted).toBeTrue();
      annotationObject = await openmct.annotation.create(tagCreationArguments);
      expect(annotationObject).toBeDefined();
      expect(annotationObject.type).toEqual('annotation');
      expect(annotationObject.tags).toContain('aWonderfulTag');
      expect(annotationObject._deleted).toBeFalse();
    });
  });

  describe('Search', () => {
    let sharedWorkerToRestore;
    beforeEach(async () => {
      // use local worker
      sharedWorkerToRestore = openmct.objects.inMemorySearchProvider.worker;
      openmct.objects.inMemorySearchProvider.worker = null;
      await openmct.objects.inMemorySearchProvider.index(mockFolderObject);
      await openmct.objects.inMemorySearchProvider.index(mockDomainObject);
      await openmct.objects.inMemorySearchProvider.index(mockAnnotationObject);
    });
    afterEach(() => {
      openmct.objects.inMemorySearchProvider.worker = sharedWorkerToRestore;
    });
    it('can search for tags', async () => {
      const results = await openmct.annotation.searchForTags('S');
      expect(results).toBeDefined();
      expect(results.length).toEqual(1);
    });
    it('returns no tags for empty search', async () => {
      const results = await openmct.annotation.searchForTags('q');
      expect(results).toBeDefined();
      expect(results.length).toEqual(0);
    });
  });
});
