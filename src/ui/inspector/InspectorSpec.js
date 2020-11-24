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
    resetApplicationState,
    // mockLocalStorage
} from 'utils/testing';
import Vue from 'vue';
import StylesView from '@/plugins/condition/components/inspector/StylesView.vue';
import SavedStylesView from '@/ui/inspector/styles/SavedStylesView.vue';
import stylesManager from '@/ui/inspector/styles/StylesManager';

describe("the inspector", () => {
    let openmct;
    let element;
    let child;
    let selection;
    let stylesViewComponent;
    let savedStylesViewComponent;
    let mockStyle;
    let mockLocalStorage;
    let mockGetItem;
    let mockSetItem;

    beforeEach((done) => {
        spyOn(SavedStylesView.methods, 'showLimitReachedDialog').and.callThrough();

        openmct = createOpenMct();
        openmct.on('start', done);
        openmct.startHeadless();

        mockLocalStorage = {};
        mockGetItem = (key) => {
            return mockLocalStorage[key];
        };

        mockSetItem = (key, value) => {
            mockLocalStorage[key] = typeof value === 'string' ? value : JSON.stringify(value);
        };

        spyOn(Storage.prototype, 'getItem').and.callFake(mockGetItem);
        spyOn(Storage.prototype, 'setItem').and.callFake(mockSetItem);

        selection = getMockSelection();

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        savedStylesViewComponent = new Vue({
            provide: {
                openmct,
                selection,
                stylesManager
            },
            el: element,
            components: {
                SavedStylesView
            },
            template: '<SavedStylesView />'
        });

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        stylesViewComponent = new Vue({
            provide: {
                openmct,
                selection,
                stylesManager
            },
            el: element,
            components: {
                StylesView
            },
            template: '<StylesView />'
        });

        mockStyle = {
            backgroundColor: "#ff0000",
            border: "#ff0000",
            color: "#ff0000"
        };
    });

    afterEach(() => {
        stylesViewComponent.$destroy();
        stylesViewComponent = undefined;
        savedStylesViewComponent.$destroy();
        savedStylesViewComponent = undefined;

        return resetApplicationState(openmct);
    });

    it("should allow a style to be saved", () => {
        expect(savedStylesViewComponent.$children[0].savedStyles.length).toBe(0);

        stylesViewComponent.$children[0].saveStyle(mockStyle);

        expect(savedStylesViewComponent.$children[0].savedStyles.length).toBe(1);
    });

    it("should display all saved styles", () => {
        expect(savedStylesViewComponent.$children[0].$children.length).toBe(0);
        stylesViewComponent.$children[0].saveStyle(mockStyle);

        Vue.nextTick().then(() => {
            expect(savedStylesViewComponent.$children[0].$children.length).toBe(1);
        });
    });

    it("should allow a saved style to be applied", () => {

    });

    it("should allow a saved style to be deleted", () => {
        stylesViewComponent.$children[0].saveStyle(mockStyle);

        expect(savedStylesViewComponent.$children[0].savedStyles.length).toBe(1);

        savedStylesViewComponent.$children[0].deleteStyle(0);

        expect(savedStylesViewComponent.$children[0].savedStyles.length).toBe(0);
    });

    it("should prevent a style from being saved when the number of saved styles is at the limit", () => {
        for (let i = 1; i <= 20; i++) {
            stylesViewComponent.$children[0].saveStyle(mockStyle);
        }

        expect(SavedStylesView.methods.showLimitReachedDialog).not.toHaveBeenCalled();
        expect(savedStylesViewComponent.$children[0].savedStyles.length).toBe(20);

        stylesViewComponent.$children[0].saveStyle(mockStyle);

        expect(SavedStylesView.methods.showLimitReachedDialog).toHaveBeenCalled();
        expect(savedStylesViewComponent.$children[0].savedStyles.length).toBe(20);
    });

    it("should prevent a style from being saved when the selection has mixed styling", () => {

    });

    it("should prevent the style from being saved when the selection has non-specific font styling", () => {

    });

    it("should allow a saved style to be applied", () => {

    });
});

function getMockSelection() {
    return [
        [{
            context: {
                item: {
                    configuration: {},
                    type: 'table',
                    identifier: {
                        key: 'mock-telemetry-table-1',
                        namespace: ''
                    }
                }
            }
        }]
    ];
}
