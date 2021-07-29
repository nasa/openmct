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

import EditPropertiesAction from './actions/EditPropertiesAction';
import FormProperties from './components/FormProperties.vue';

import Vue from 'vue';

export const CONTROLS = [
    "autocomplete",
    "button",
    "checkbox",
    "color",
    "composite",
    "datetime",
    "dialog-button",
    "file-input",
    "menu-button",
    "numberfield",
    "radio",
    "select",
    "textarea",
    "textfield"
];

export default class FormsAPI {
    constructor(openmct) {
        this.openmct = openmct;
        this.controls = {};

        this.init();
    }

    addControl(name, actions) {
        const control = this.controls[name];
        if (control) {
            this.openmct.notifications.error(`Error: provided form control '${name}', already exists`);

            return;
        }

        this.controls[name] = actions;
    }

    getAllControls() {
        return this.controls;
    }

    getControl(name) {
        const control = this.controls[name];
        if (control) {
            console.error(`Error: form control '${name}', does not exist`);
        }

        return control;
    }

    /**
     * Section definition for formStructure
     * @typedef Section
        * @property {object} name Name of the section to display on Form
        * @property {string} cssClass class name for styling section
        * @property {array<Row>} rows collection of rows inside a section
    */

    /**
     * Row definition for Section
     * @typedef Row
        * @property {string} control represents type of row to render
        *     eg:autocomplete,composite,datetime,file-input,locator,numberfield,select,textarea,textfield
        * @property {string} cssClass class name for styling this row
        * @property {module:openmct.DomainObject} domainObject object to be used by row
        * @property {string} key id for this row
        * @property {string} name Name of the row to display on Form
        * @property {module:openmct.DomainObject} parent parent object to be used by row
        * @property {boolean} required is this row mandatory
        * @property {function} validate a function to validate this row on any changes
    */

    /**
     * Show form inside an Overlay dialog with given form structure
     *
     * @private
     * @param {Array<Section>} formStructure a form structure, array of section
     * @param {Object} options
     *      @property {module:openmct.DomainObject} domainObject object to be used by form
     *      @property {module:openmct.DomainObject} parentDomainObject parent object to be used by form
     *      @property {function} onChange a callback function when any changes detected
     *      @property {function} onSave a callback function when form is submitted
     *      @property {function} onDismiss a callback function when form is dismissed
     */
    showForm(formStructure, options) {
        const changes = {};
        let overlay;

        let parentDomainObject = options.parentDomainObject || {};
        let parentDomainObjectPath;
        const domainObject = options.domainObject;

        const vm = new Vue({
            components: { FormProperties },
            provide: {
                openmct: this.openmct,
                domainObject
            },
            data() {
                return {
                    formStructure,
                    onChange,
                    onDismiss,
                    onSave
                };
            },
            template: '<FormProperties :model="formStructure" @onChange="onChange" @onDismiss="onDismiss" @onSave="onSave"></FormProperties>'
        }).$mount();

        overlay = this.openmct.overlays.overlay({
            element: vm.$el,
            size: 'small',
            onDestroy: () => vm.$destroy()
        });

        function onChange(data) {
            if (options.onChange) {
                options.onChange(data);
            }

            if (data.model) {
                const property = data.model.property;
                let key = data.model.key;
                if (key === 'location') {
                    parentDomainObject = data.value;
                    parentDomainObjectPath = data.parentObjectPath;
                }

                if (property && property.length) {
                    key = property.join('.');
                }

                changes[key] = data.value;
            }
        }

        function onDismiss() {
            overlay.dismiss();

            if (options.onDismiss) {
                options.onDismiss();
            }
        }

        function onSave() {
            overlay.dismiss();

            if (options.onSave) {
                options.onSave(domainObject, changes, parentDomainObject, parentDomainObjectPath);
            }
        }
    }

    /**
     * @private
     */
    _addDefaultFormControls() {
        CONTROLS.forEach(control => {
            this.addControl(control);
        });
    }

    init() {
        this.openmct.actions.register(new EditPropertiesAction(this.openmct));

        this._addDefaultFormControls();
    }
}
