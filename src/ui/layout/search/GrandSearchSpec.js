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

import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';
import Vue from 'vue';
import GrandSearch from './GrandSearch.vue';
import ExampleTagsPlugin from '../../../../example/exampleTags/plugin';

describe("GrandSearch", () => {
    let openmct;
    let grandSearchComponent;
    let viewContainer;
    let parent;
    let sharedWorkerToRestore;
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

        const mockObjectProvider = jasmine.createSpyObj("mock provider", [
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

        openmct.on('start', async () => {
            // use local worker
            sharedWorkerToRestore = openmct.objects.inMemorySearchProvider.worker;
            openmct.objects.inMemorySearchProvider.worker = null;
            await openmct.objects.inMemorySearchProvider.index(mockDomainObject);
            await openmct.objects.inMemorySearchProvider.index(mockAnnotationObject);
            parent = document.createElement('div');
            document.body.appendChild(parent);
            viewContainer = document.createElement('div');
            parent.append(viewContainer);
            grandSearchComponent = new Vue({
                el: viewContainer,
                components: {
                    GrandSearch
                },
                provide: {
                    openmct
                },
                template: '<GrandSearch/>'
            }).$mount();
            await Vue.nextTick();
            done();
        });
        openmct.startHeadless();
    });

    afterEach(() => {
        openmct.objects.inMemorySearchProvider.worker = sharedWorkerToRestore;
        grandSearchComponent.$destroy();

        return resetApplicationState(openmct);
    });

    it("should render an object search result", async () => {
        await grandSearchComponent.$children[0].searchEverything('foo');
        await Vue.nextTick();
        const searchResult = document.querySelector('[aria-label="fooRabbitNotebook notebook result"]');
        expect(searchResult).toBeDefined();
    });

    it("should render an annotation search result", async () => {
        await grandSearchComponent.$children[0].searchEverything('S');
        await Vue.nextTick();
        const annotationResult = document.querySelector('[aria-label="Search Result"]');
        expect(annotationResult).toBeDefined();
    });
});
