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

import MenuAPI from './MenuAPI';
import Menu from './menu';
import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe ('The Menu API', () => {
    let openmct;
    let menuAPI;
    let actionsArray;
    let x;
    let y;
    let result;

    beforeEach(() => {
        openmct = createOpenMct();
        menuAPI = new MenuAPI(openmct);
        actionsArray = [
            {
                name: 'Test Action 1',
                cssClass: 'test-css-class-1',
                description: 'This is a test action',
                callBack: () => {
                    result = 'Test Action 1 Invoked';
                }
            },
            {
                name: 'Test Action 2',
                cssClass: 'test-css-class-2',
                description: 'This is a test action',
                callBack: () => {
                    result = 'Test Action 2 Invoked';
                }
            }
        ];
        x = 8;
        y = 16;
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    describe("showMenu method", () => {
        it("creates an instance of Menu when invoked", () => {
            menuAPI.showMenu(x, y, actionsArray);

            expect(menuAPI.menuComponent).toBeInstanceOf(Menu);
        });

        describe("creates a menu component", () => {
            let menuComponent;
            let vueComponent;

            beforeEach(() => {
                menuAPI.showMenu(x, y, actionsArray);
                vueComponent = menuAPI.menuComponent.component;
                menuComponent = document.querySelector(".c-menu");

                spyOn(vueComponent, '$destroy');
            });

            it("renders a menu component in the expected x and y coordinates", () => {
                let boundingClientRect = menuComponent.getBoundingClientRect();
                let left = boundingClientRect.left;
                let top = boundingClientRect.top;

                expect(left).toEqual(x);
                expect(top).toEqual(y);
            });

            it("with all the actions passed in", () => {
                expect(menuComponent).toBeDefined();

                let listItems = menuComponent.children[0].children;

                expect(listItems.length).toEqual(actionsArray.length);
            });

            it("with click-able menu items, that will invoke the correct callBacks", () => {
                let listItem1 = menuComponent.children[0].children[0];

                listItem1.click();

                expect(result).toEqual("Test Action 1 Invoked");
            });

            it("dismisses the menu when action is clicked on", () => {
                let listItem1 = menuComponent.children[0].children[0];

                listItem1.click();

                let menu = document.querySelector('.c-menu');

                expect(menu).toBeNull();
            });

            it("invokes the destroy method when menu is dismissed", () => {
                document.body.click();

                expect(vueComponent.$destroy).toHaveBeenCalled();
            });
        });
    });
});
