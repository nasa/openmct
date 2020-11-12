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
import DuplicateActionPlugin from './plugin.js';
import DuplicateAction from './DuplicateAction.js';
import DuplicateTask from './DuplicateTask.js';
import {
    createOpenMct,
    resetApplicationState,
    getMockObjects
} from 'utils/testing';

describe("The Duplicate Action plugin", () => {

    let openmct;
    let duplicateTask;
    let childObject;
    let parentObject;
    let anotherParentObject;

    // this setups up the app
    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        childObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Child Folder",
                    identifier: {
                        namespace: "",
                        key: "child-folder-object"
                    }
                }
            }
        }).folder;
        parentObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Parent Folder",
                    composition: [childObject.identifier]
                }
            }
        }).folder;
        anotherParentObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Another Parent Folder"
                }
            }
        }).folder;

        // already installed by default, but never hurts, just adds to context menu
        openmct.install(DuplicateActionPlugin());

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    it("should be defined", () => {
        expect(DuplicateActionPlugin).toBeDefined();
    });

    describe("when moving an object to a new parent", () => {

        beforeEach(async (done) => {
            duplicateTask = new DuplicateTask(openmct);
            await duplicateTask.duplicate(parentObject, anotherParentObject);
            done();
        });

        it("the duplicate child object's name (when not changing) should be the same as the original object", async (done) => {
            let duplicatedObjectIdentifier = anotherParentObject.composition[0];
            let duplicatedObject = await openmct.objects.get(duplicatedObjectIdentifier);
            let duplicateObjectName = duplicatedObject.name;

            expect(duplicateObjectName).toEqual(parentObject.name);
            done();
        });

        it("the duplicate child object's identifier should be new", () => {
            let duplicatedObjectIdentifier = anotherParentObject.composition[0];

            expect(duplicatedObjectIdentifier.key).not.toEqual(parentObject.identifier.key);
        });
    });

    describe("when a new name is provided for the duplicated object", () => {
        const NEW_NAME = 'New Name';

        beforeEach(() => {
            duplicateTask = new DuplicateAction(openmct);
            duplicateTask.updateNameCheck(parentObject, NEW_NAME);
        });

        it("the name is updated", () => {
            let childName = parentObject.name;
            expect(childName).toEqual(NEW_NAME);
        });
    });

});
