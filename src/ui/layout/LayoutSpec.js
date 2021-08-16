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
import Vue from 'vue';
import Layout from './Layout.vue';

fdescribe('Open MCT Layout:', () => {
    let openmct;
    let element;
    let treePane;
    let treeCollapseButton;
    let treeExpandButton;
    let inspectorPane;
    let inspectorCollapseButton;
    let inspectorExpandButton;

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.on('start', done);

        // spyOn(openmct.objectViews, 'get')
        //     .and.callFake(() => Promise.resolve([]));

        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe('the tree pane:', () => {
        it('is displayed on layout load', async () => {
            await createLayout();
            await Vue.nextTick();

            expect(treePane).toBeTruthy();
            expect(isCollapsed(treePane)).toBeFalse();
        });

        it('is collapsed on layout load if specified by a hide param', async () => {
            openmct.router.setSearchParam('hideTree', true);

            await createLayout();
            await Vue.nextTick();

            expect(isCollapsed(treePane)).toBeTrue();
        });

        it('on toggle collapses if expanded', async () => {
            await createLayout();
            treeCollapseButton.click();
            await Vue.nextTick();

            const isHideParamSet = openmct.router.getSearchParam('hideTree') === 'true';
            expect(isHideParamSet).toBeTrue();
            expect(isCollapsed(treePane)).toBeTrue();
        });

        it('on toggle expands if collapsed', async () => {
            openmct.router.setSearchParam('hideTree', true);

            await createLayout();
            treeExpandButton.click();
            await Vue.nextTick();

            const isHideParamSet = openmct.router.getSearchParam('hideTree') === 'true';
            expect(isHideParamSet).toBeFalse();
            expect(isCollapsed(treePane)).toBeFalse();
        });
    });

    async function createLayout() {
        const el = document.createElement('div');
        const child = document.createElement('div');
        el.appendChild(child);

        element = await new Vue({
            el,
            components: {
                Layout
            },
            provide: {
                openmct
            },
            template: `<Layout ref="layout"/>`
        }).$mount().$el;

        setComponents();
    }

    function setComponents() {
        treePane = element.querySelector('.l-shell__pane-tree');
        treeCollapseButton = element.querySelector('.l-shell__pane-tree .l-pane__collapse-button');
        treeExpandButton = element.querySelector('.l-shell__pane-tree .l-pane__expand-button');

        inspectorPane = element.querySelector('.l-shell__pane-inspector');
        inspectorCollapseButton = inspectorPane.querySelector('.l-shell__pane-inspector .l-pane__collapse-button');
        inspectorExpandButton = element.querySelector('.l-shell__pane-inspector .l-pane__expand-button');
    }

    function isCollapsed(el) {
        return el.classList.contains('l-pane--collapsed');
    }
});
