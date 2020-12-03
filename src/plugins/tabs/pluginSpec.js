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

import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

fdescribe("the tabs plugin", () => {
    let openmct;

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it("defines a tabs object that is creatable", () => {
        const tabsType = openmct.types.get('tabs');

        expect(tabsType.definition.creatable).toBe(true);
    });

    it("defines a form to configure the tabs object", () => {
        const tabsType = openmct.types.get('tabs');

        expect(tabsType.definition.form).toBeDefined();
    });

    it("provides a tabs view", () => {
        const domainObject = {
            identifier: {
                namespace: '',
                key: 'mock-tabs-object'
            },
            type: 'tabs'
        };
        const applicableViews = openmct.objectViews.get(domainObject);
        const tabsView = applicableViews.find((viewProvider) => viewProvider.key === 'tabs');

        expect(tabsView).toBeDefined();
    });

    describe("the tabs view", () => {
        it("displays instructional text instead of tabs if no tabs exist", () => {
            const domainObject = {
                identifier: {
                    namespace: '',
                    key: 'mock-tabs-object'
                },
                type: 'tabs'
            };
            const element = document.createElement('div');
            const child = document.createElement('div');
            element.appendChild(child);

            const applicableViews = openmct.objectViews.get(domainObject);
            const tabsViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'tabs');
            const tabsView = tabsViewProvider.view(domainObject, [domainObject]);
            tabsView.show(child, true);

            const noTabsElement = getNoTabsElement(element);

            expect(noTabsElement).not.toBeNull();
        });

        it("creates a tab for each object dropped into the drop zone", () => {

        });

        it("creates a tab level for objects dropped into current tab view", () => {

        });

        it("removes a tab and tab contents", () => {

        });
    });

    function getNoTabsElement(parent) {
        return parent.querySelector('.c-tabs-view__empty-message');
    }

    function getTabElements(parent) {
        return parent.querySelectorAll('.c-tabs-view__tab');
    }
});
