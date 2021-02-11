/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import {createOpenMct, resetApplicationState, spyOnBuiltins} from "utils/testing";
import SynchronizedFolderPlugin from './plugin';
import PLAN_FOLDER_KEY from './SynchronizedObjectsProvider';

fdescribe('the plugin', function () {
    let identifier = {
        namespace: 'mct',
        key: PLAN_FOLDER_KEY
    };
    let testPath = '/test/db';
    let provider;
    let composition;
    let mockListener;
    let mockParent = {
        name: 'Items',
        identifier: {
            namespace: '',
            key: 'mine'
        },
        composition: []
    };
    let openmct;

    beforeEach((done) => {

        openmct = createOpenMct();

        composition = openmct.composition.get(mockParent);
        composition.on('add', mockListener);

        openmct.install(openmct.plugins.CouchDB(testPath));

        openmct.install(new SynchronizedFolderPlugin('Test Folder'));

        mockListener = jasmine.createSpy('mockListener');

        spyOnBuiltins(['fetch'], window);
        fetch.and.returnValues([
            Promise.resolve(undefined),
            Promise.resolve([
                {
                    identifier: {
                        key: "1",
                        namespace: "mct"
                    }
                },
                {
                    identifier: {
                        key: "2",
                        namespace: "mct"
                    }
                }
            ])
        ]);

        openmct.on('start', done);
        openmct.startHeadless();

        provider = openmct.objects.getProvider(identifier);
        spyOn(provider, 'getChanges').and.callThrough();
        spyOn(provider, 'abortGetChanges').and.callThrough();
        spyOn(provider, 'create').and.callThrough();
        spyOn(provider, 'get').and.callThrough();

    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('creates an object interceptor for plan folders', () => {
        const interceptors = openmct.objects.listGetInterceptors(identifier);
        expect(interceptors.length).toEqual(1);
    });

    it('creates a folder called Test Folder', () => {
        setTimeout(() => {
            expect(mockListener).toHaveBeenCalled();
        }, 500);
    });

    it('refreshes objects with updates', () => {
        setTimeout(() => {
            expect(openmct.objects.refresh).toHaveBeenCalledTimes(2);
            expect(openmct.objects.refresh).toHaveBeenCalledWith(jasmine.objectContaining({
                identifier: {
                    key: "1",
                    namespace: "mct"
                }
            }));
            expect(openmct.objects.refresh).toHaveBeenCalledWith(jasmine.objectContaining({
                identifier: {
                    key: "2",
                    namespace: "mct"
                }
            }));
        }, 200);
    });

});
