/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { createOpenMct, resetApplicationState, getMockObjects } from 'utils/testing';
import ConditionWidgetPlugin from "./plugin";
import Vue from 'vue';

describe('the plugin', () => {
    const CONDITION_WIDGET_KEY = 'conditionWidget';
    let openmct;

    const mockObj = getMockObjects({
        objectKeyStrings: [CONDITION_WIDGET_KEY, 'telemetry'],
        format: 'utc'
    });

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(new ConditionWidgetPlugin());

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it("should have a view provider for condition widget objects", () => {
        const applicableViews = openmct.objectViews.get(mockObj[CONDITION_WIDGET_KEY], []);

        const conditionWidgetViewProvider = applicableViews.find(
            (viewProvider) => viewProvider.key === CONDITION_WIDGET_KEY
        );

        expect(applicableViews.length).toEqual(1);
        expect(conditionWidgetViewProvider).toBeDefined();
    });

    it("should render a view with a URL and label", async () => {
        const parent = document.createElement('div');
        const child = document.createElement('div');
        parent.appendChild(child);

        const applicableViews = openmct.objectViews.get(mockObj[CONDITION_WIDGET_KEY], []);

        const conditionWidgetViewProvider = applicableViews.find(
            (viewProvider) => viewProvider.key === CONDITION_WIDGET_KEY
        );

        const conditionWidgetView = conditionWidgetViewProvider.view(mockObj[CONDITION_WIDGET_KEY], [mockObj[CONDITION_WIDGET_KEY]]);
        conditionWidgetView.show(child);

        await Vue.nextTick();

        const domainUrl = mockObj[CONDITION_WIDGET_KEY].url;
        expect(parent.innerHTML).toContain(`<a href="${domainUrl}"`);

        const conditionWidgetRender = parent.querySelector('.c-condition-widget');
        expect(conditionWidgetRender).toBeDefined();
        expect(conditionWidgetRender.innerHTML).toContain('<div class="c-condition-widget__label">');

        const conditionWidgetLabel = conditionWidgetRender.querySelector('.c-condition-widget__label');
        expect(conditionWidgetLabel).toBeDefined();
        const domainLabel = mockObj[CONDITION_WIDGET_KEY].label;
        expect(conditionWidgetLabel.textContent).toContain(domainLabel);
    });
});
