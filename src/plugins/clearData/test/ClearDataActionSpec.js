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

import ClearDataActionPlugin from '../plugin.js';
import ClearDataAction from '../ClearDataAction.js';

describe('When the Clear Data Plugin is installed,', () => {
    const mockObjectViews = jasmine.createSpyObj('objectViews', ['emit']);
    const mockIndicatorProvider = jasmine.createSpyObj('indicators', ['add']);
    const mockActionsProvider = jasmine.createSpyObj('actions', ['register']);
    const goodMockSelectionPath = [[{
        context: {
            item: {
                identifier: {
                    key: 'apple',
                    namespace: ''
                }
            }
        }
    }]];

    const openmct = {
        objectViews: mockObjectViews,
        indicators: mockIndicatorProvider,
        actions: mockActionsProvider,
        install: function (plugin) {
            plugin(this);
        },
        selection: {
            get: function () {
                return goodMockSelectionPath;
            }
        },
        objects: {
            areIdsEqual: function (obj1, obj2) {
                return true;
            }
        }
    };

    const mockObjectPath = [
        {
            name: 'mockObject1',
            type: 'apple'
        },
        {
            name: 'mockObject2',
            type: 'banana'
        }
    ];

    it('Global Clear Indicator is installed', () => {
        openmct.install(ClearDataActionPlugin([]));

        expect(mockIndicatorProvider.add).toHaveBeenCalled();
    });

    it('Clear Data context menu action is installed', () => {
        openmct.install(ClearDataActionPlugin([]));

        expect(mockActionsProvider.register).toHaveBeenCalled();
    });

    it('clear data action emits a clearData event when invoked', () => {
        const action = new ClearDataAction(openmct);

        action.invoke(mockObjectPath);

        expect(mockObjectViews.emit).toHaveBeenCalledWith('clearData', mockObjectPath[0]);
    });

    it('clears data on applicable objects', () => {
        let action = new ClearDataAction(openmct, ['apple']);

        const actionApplies = action.appliesTo(mockObjectPath);

        expect(actionApplies).toBe(true);
    });

    it('does not clear data on inapplicable objects', () => {
        let action = new ClearDataAction(openmct, ['pineapple']);

        const actionApplies = action.appliesTo(mockObjectPath);

        expect(actionApplies).toBe(false);
    });

    it('does not clear data if not in the selection path and not a layout', () => {
        openmct.objects = {
            areIdsEqual: function (obj1, obj2) {
                return false;
            }
        };
        openmct.router = {
            path: [{type: 'not-a-layout'}]
        };

        let action = new ClearDataAction(openmct, ['apple']);

        const actionApplies = action.appliesTo(mockObjectPath);

        expect(actionApplies).toBe(false);
    });

    it('does clear data if not in the selection path and is a layout', () => {
        openmct.objects = {
            areIdsEqual: function (obj1, obj2) {
                return false;
            }
        };
        openmct.router = {
            path: [{type: 'layout'}]
        };

        let action = new ClearDataAction(openmct, ['apple']);

        const actionApplies = action.appliesTo(mockObjectPath);

        expect(actionApplies).toBe(true);
    });
});
