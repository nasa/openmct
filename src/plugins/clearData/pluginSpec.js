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

import ClearDataPlugin from './plugin.js';
import GlobalClearIndicator from "./components/GlobalClearIndicator.vue";
import { createOpenMct, resetApplicationState } from 'utils/testing';

describe('The Clear Data Plugin:', () => {
    let clearDataPlugin;
    let openmct;
    let indicatorObject;
    let indicatorElement;
    let parentElement;
    let mockObjectPath;
    let clearDataAction;
    let testViewObject;
    let selection;

    beforeEach((done) => {
        openmct = createOpenMct();

        clearDataPlugin = new ClearDataPlugin(
            ['table', 'telemetry.plot.overlay', 'telemetry.plot.stacked'],
            {indicator: true}
        );
        openmct.install(clearDataPlugin);

        parentElement = document.createElement('div');

        indicatorObject = openmct.indicators.indicatorObjects.find(indicator => indicator.key === 'global-clear-indicator');
        indicatorElement = indicatorObject.element;

        clearDataAction = openmct.actions.getAction('clear-data-action');
        testViewObject = [{
            identifier: {
                key: "foo-table",
                namespace: ''
            },
            type: "table"
        }];
        openmct.router.path = testViewObject;
        mockObjectPath = [
            {
                name: 'Mock Table',
                type: 'table',
                identifier: {
                    key: "foo-table",
                    namespace: ''
                }
            }
        ];
        selection = [
            {
                context: {
                    item: mockObjectPath[0]
                }
            }
        ];

        openmct.selection.select(selection);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(async () => {
        openmct.router.path = null;
        await resetApplicationState(openmct);
    });

    it('Installs the global clear indicator', () => {
        expect(indicatorObject).toBeDefined();
    });

    it('Clear Data context menu action is installed', () => {
        expect(clearDataAction).toBeDefined();
    });

    it('activated on applicable objects', () => {
        const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);

        expect(gatheredActions.applicableActions['clear-data-action']).toBeDefined();
    });

    it('not activated on inapplicable objects', () => {
        testViewObject = [{
            identifier: {
                key: "foo-widget",
                namespace: ''
            },
            type: "widget"
        }];
        mockObjectPath = [
            {
                name: 'Mock Widget',
                type: 'widget',
                identifier: {
                    key: "foo-widget",
                    namespace: ''
                }
            }
        ];
        selection = [
            {
                context: {
                    item: mockObjectPath[0]
                }
            }
        ];

        openmct.selection.select(selection);

        const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);

        expect(gatheredActions.applicableActions['clear-data-action']).toBeUndefined();
    });

    it('does not clear data if not in the selection path and not a layout', () => {
        selection = [
            {
                context: {
                    item: {
                        name: 'Some Random Widget',
                        type: 'not-in-path-widget',
                        identifier: {
                            key: "something-else-widget",
                            namespace: ''
                        }
                    }
                }
            }
        ];

        openmct.selection.select(selection);

        const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);

        expect(gatheredActions.applicableActions['clear-data-action']).toBeUndefined();
    });

    it('does clear data if not in the selection path and is a layout', () => {
        selection = [
            {
                context: {
                    item: {
                        name: 'Some Random Widget',
                        type: 'not-in-path-widget',
                        identifier: {
                            key: "something-else-widget",
                            namespace: ''
                        }
                    }
                }
            }
        ];

        openmct.selection.select(selection);

        testViewObject = [{
            identifier: {
                key: "foo-layout",
                namespace: ''
            },
            type: "layout"
        }];
        openmct.router.path = testViewObject;

        const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);

        expect(gatheredActions.applicableActions['clear-data-action']).toBeDefined();
    });

    it('installs a global clear indicator', async () => {
        const globalClearIndicator = openmct.indicators.indicatorObjects
            .find(indicator => indicator.key === 'global-clear-indicator').element;
        expect(globalClearIndicator).toBeDefined();
    });
});
