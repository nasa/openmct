/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe("The Forms API", () => {
    let openmct;

    beforeEach(() => {
        openmct = createOpenMct();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it("form API exists", () => {
        expect(openmct.forms.showForm).not.toBe(null);
    });

    describe('check default form controls exists', () => {
        it("autocomplete", () => {
            const control = openmct.forms.getFormControl('autocomplete');
            expect(control.show).not.toBe(null);
        });

        it("clock", () => {
            const control = openmct.forms.getFormControl('composite');
            expect(control.show).not.toBe(null);
        });

        it("datetime", () => {
            const control = openmct.forms.getFormControl('datetime');
            expect(control.show).not.toBe(null);
        });

        it("file-input", () => {
            const control = openmct.forms.getFormControl('file-input');
            expect(control.show).not.toBe(null);
        });

        it("locator", () => {
            const control = openmct.forms.getFormControl('datetime');
            expect(control.show).not.toBe(null);
        });
        it("numberfield", () => {
            const control = openmct.forms.getFormControl('datetime');
            expect(control.show).not.toBe(null);
        });
        it("select", () => {
            const control = openmct.forms.getFormControl('datetime');
            expect(control.show).not.toBe(null);
        });
        it("textarea", () => {
            const control = openmct.forms.getFormControl('datetime');
            expect(control.show).not.toBe(null);
        });
        it("textfield", () => {
            const control = openmct.forms.getFormControl('datetime');
            expect(control.show).not.toBe(null);
        });
    });

    it("addNewFormControl", () => {
        const newFormControl = {
            show: () => {
                console.log('show new control');
            },
            destroy: () => {
                console.log('destroy');
            }
        };
        openmct.forms.addNewFormControl('newFormControl', newFormControl);
        const control = openmct.forms.getFormControl('newFormControl');
        expect(control.show).not.toBe(null);
        expect(control.destroy).not.toBe(null);
    });

    it("show form", () => {
        const element = document.createElement('div');
        const formStructure = {
            title: "Test Show Form",
            sections: [
                {
                    rows: [
                        {
                            key: "name",
                            control: "textfield",
                            name: "Title",
                            pattern: "\\S+",
                            required: true,
                            cssClass: "l-input-lg",
                            value: 'Test Name'
                        }
                    ]
                }
            ]
        };

        openmct.forms.showForm(formStructure, { element });

        const titleElement = element.querySelector('.c-overlay__dialog-title');

        expect(titleElement.textContent).toBe(formStructure.title);
    });
});
