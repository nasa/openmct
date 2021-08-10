/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
import myItemsIdentifier from './myItemsIdentifier';
import myItemsInterceptor from './myItemsInterceptor';

/*
The plugin installs the my items folder to the root
The plugin adds an interceptor for missing my items objects
The interceptor will return a my items model if the object is undefined
*/

fdescribe("the plugin", () => {
    let openmct;

    beforeEach((done) => {
        openmct = createOpenMct();

        openmct.plugins.install(openmct.plugins.MyItems());

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('when installed, adds "My Items" to the root', async () => {
        const root = await openmct.objects.get('ROOT');
        let myItems = root.composition.filter((identifier) => {
            return identifier.key === myItemsIdentifier.key
                && identifier.namespace === myItemsIdentifier.namespace;
        })[0];

        expect(myItems).toBeDefined();
    });

    // describe('when invoked', () => {

    //     beforeEach((done) => {
    //         compositionAPI = openmct.composition;
    //         mockObjectPath = [{
    //             name: 'mock folder',
    //             type: 'folder',
    //             identifier: {
    //                 key: 'mock-folder',
    //                 namespace: ''
    //             }
    //         }];
    //         mockPromise = {
    //             then: (callback) => {
    //                 callback({name: newFolderName});
    //                 done();
    //             }
    //         };

    //         mockDialogService = jasmine.createSpyObj('dialogService', ['getUserInput']);
    //         mockComposition = jasmine.createSpyObj('composition', ['add']);

    //         mockDialogService.getUserInput.and.returnValue(mockPromise);

    //         spyOn(openmct.$injector, 'get').and.returnValue(mockDialogService);
    //         spyOn(compositionAPI, 'get').and.returnValue(mockComposition);
    //         spyOn(openmct.objects, 'save').and.returnValue(Promise.resolve(true));

    //         return newFolderAction.invoke(mockObjectPath);
    //     });

    //     it('gets user input for folder name', () => {
    //         expect(mockDialogService.getUserInput).toHaveBeenCalled();
    //     });

    //     it('creates a new folder object', () => {
    //         expect(openmct.objects.save).toHaveBeenCalled();
    //     });

    //     it('adds new folder object to parent composition', () => {
    //         expect(mockComposition.add).toHaveBeenCalled();
    //     });
    // });
});
