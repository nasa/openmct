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

import ActionsAPI from './ActionsAPI';
import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe('The Actions API', () => {
    let openmct;
    let actionsAPI;
    let mockAction;
    let mockObjectPath;
    let mockViewContext1;

    beforeEach(() => {
        openmct = createOpenMct();
        actionsAPI = new ActionsAPI(openmct);
        mockAction = {
            name: 'Test Action',
            key: 'test-action',
            cssClass: 'test-action',
            description: 'This is a test action',
            group: 'action',
            priority: 9,
            appliesTo: (objectPath, view = {}) => {
                if (view.getViewContext) {
                    let viewContext = view.getViewContext();

                    return viewContext.onlyAppliesToTestCase;
                } else if (objectPath.length) {
                    return objectPath[0].type === 'fake-folder';
                }

                return false;
            },
            invoke: () => {
            }
        };
        mockObjectPath = [
            {
                name: 'mock folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            },
            {
                name: 'mock parent folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-parent-folder',
                    namespace: ''
                }
            }
        ];
        mockViewContext1 = {
            getViewContext: () => {
                return {
                    onlyAppliesToTestCase: true,
                    skipCache: true
                };
            }
        };
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    describe("register method", () => {
        it("adds action to ActionsAPI", () => {
            actionsAPI.register(mockAction);

            let action = actionsAPI.get(mockObjectPath, mockViewContext1)[mockAction.key];

            expect(action.key).toEqual(mockAction.key);
            expect(action.name).toEqual(mockAction.name);
        });
    });

    describe("get method", () => {
        beforeEach(() => {
            actionsAPI.register(mockAction);
        });

        it("returns an object with relevant actions when invoked with objectPath only", () => {
            let action = actionsAPI.get(mockObjectPath, mockViewContext1)[mockAction.key];

            expect(action.key).toEqual(mockAction.key);
            expect(action.name).toEqual(mockAction.name);
        });

        it("returns an object with relevant actions when invoked with viewContext and skipCache", () => {
            let action = actionsAPI.get(mockObjectPath, mockViewContext1)[mockAction.key];

            expect(action.key).toEqual(mockAction.key);
            expect(action.name).toEqual(mockAction.name);
        });
    });
});
