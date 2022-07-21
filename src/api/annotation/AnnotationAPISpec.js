/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
import ExampleTagsPlugin from "../../../example/exampleTags/plugin";

describe("The Annotation API", () => {
    let openmct;
    let mockObjectProvider;
    let mockDomainObject;
    let mockAnnotationObject;

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(new ExampleTagsPlugin());
        const availableTags = openmct.annotation.getAvailableTags();
        mockDomainObject = {
            type: 'notebook',
            name: 'fooRabbitNotebook',
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

        mockObjectProvider = jasmine.createSpyObj("mock provider", [
            "create",
            "update",
            "get"
        ]);
        // eslint-disable-next-line require-await
        mockObjectProvider.get = async (identifier) => {
            if (identifier.key === mockDomainObject.identifier.key) {
                return mockDomainObject;
            } else if (identifier.key === mockAnnotationObject.identifier.key) {
                return mockAnnotationObject;
            } else {
                return null;
            }
        };

        mockObjectProvider.create.and.returnValue(Promise.resolve(true));
        mockObjectProvider.update.and.returnValue(Promise.resolve(true));

        openmct.objects.addProvider('fooNameSpace', mockObjectProvider);
        openmct.on('start', done);
        openmct.startHeadless();
    });
    afterEach(async () => {
        openmct.objects.providers = {};
        await resetApplicationState(openmct);
    });
    it("is defined", () => {
        expect(openmct.annotation).toBeDefined();
    });

    describe("Creation", () => {
        it("can create annotations", async () => {
            const annotationCreationArguments = {
                name: 'Test Annotation',
                domainObject: mockDomainObject,
                annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
                tags: ['sometag'],
                contentText: "fooContext",
                targets: {'fooTarget': {}}
            };
            const annotationObject = await openmct.annotation.create(annotationCreationArguments);
            expect(annotationObject).toBeDefined();
            expect(annotationObject.type).toEqual('annotation');
        });
        it("fails if annotation is an unknown type", async () => {
            try {
                await openmct.annotation.create('Garbage Annotation', mockDomainObject, 'garbageAnnotation', ['sometag'], "fooContext", {'fooTarget': {}});
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe("Tagging", () => {
        it("can create a tag", async () => {
            const annotationObject = await openmct.annotation.addAnnotationTag(null, mockDomainObject, {entryId: 'foo'}, openmct.annotation.ANNOTATION_TYPES.NOTEBOOK, 'aWonderfulTag');
            expect(annotationObject).toBeDefined();
            expect(annotationObject.type).toEqual('annotation');
            expect(annotationObject.tags).toContain('aWonderfulTag');
        });
        it("can delete a tag", async () => {
            const originalAnnotationObject = await openmct.annotation.addAnnotationTag(null, mockDomainObject, {entryId: 'foo'}, openmct.annotation.ANNOTATION_TYPES.NOTEBOOK, 'aWonderfulTag');
            const annotationObject = await openmct.annotation.addAnnotationTag(originalAnnotationObject, mockDomainObject, {entryId: 'foo'}, openmct.annotation.ANNOTATION_TYPES.NOTEBOOK, 'anotherTagToRemove');
            expect(annotationObject).toBeDefined();
            openmct.annotation.removeAnnotationTag(annotationObject, 'anotherTagToRemove');
            expect(annotationObject.tags).toEqual(['aWonderfulTag']);
            openmct.annotation.removeAnnotationTag(annotationObject, 'aWonderfulTag');
            expect(annotationObject.tags).toEqual([]);
        });
        it("throws an error if deleting non-existent tag", async () => {
            const annotationObject = await openmct.annotation.addAnnotationTag(null, mockDomainObject, {entryId: 'foo'}, openmct.annotation.ANNOTATION_TYPES.NOTEBOOK, 'aWonderfulTag');
            expect(annotationObject).toBeDefined();
            expect(() => {
                openmct.annotation.removeAnnotationTag(annotationObject, 'ThisTagShouldNotExist');
            }).toThrow();
        });
        it("can remove all tags", async () => {
            const annotationObject = await openmct.annotation.addAnnotationTag(null, mockDomainObject, {entryId: 'foo'}, openmct.annotation.ANNOTATION_TYPES.NOTEBOOK, 'aWonderfulTag');
            expect(annotationObject).toBeDefined();
            expect(() => {
                openmct.annotation.removeAnnotationTags(annotationObject);
            }).not.toThrow();
            expect(annotationObject.tags).toEqual([]);
        });
    });

    describe("Search", () => {
        let sharedWorkerToRestore;
        beforeEach(async () => {
            // use local worker
            sharedWorkerToRestore = openmct.objects.inMemorySearchProvider.worker;
            openmct.objects.inMemorySearchProvider.worker = null;
            await openmct.objects.inMemorySearchProvider.index(mockDomainObject);
            await openmct.objects.inMemorySearchProvider.index(mockAnnotationObject);
        });
        afterEach(() => {
            openmct.objects.inMemorySearchProvider.worker = sharedWorkerToRestore;
        });
        it("can search for tags", async () => {
            const results = await openmct.annotation.searchForTags('S');
            expect(results).toBeDefined();
            expect(results.length).toEqual(1);
        });
        it("can get notebook annotations", async () => {
            const targetKeyString = openmct.objects.makeKeyString(mockDomainObject.identifier);
            const query = {
                targetKeyString,
                entryId: 'fooBarEntry'
            };

            const results = await openmct.annotation.getAnnotation(query, openmct.objects.SEARCH_TYPES.NOTEBOOK_ANNOTATIONS);
            expect(results).toBeDefined();
            expect(results.tags.length).toEqual(2);
        });
    });
});
