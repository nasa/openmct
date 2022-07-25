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

import FormController from './FormController';
import FormProperties from './components/FormProperties.vue';

import EventEmitter from 'EventEmitter';
import Vue from 'vue';

export default class FormsAPI extends EventEmitter {
    constructor(openmct) {
        super();

        this.openmct = openmct;
        this.formController = new FormController(openmct);
    }

    /**
     * Control View Provider definition for a form control
     * @typedef ControlViewProvider
        * @property {function} show a function renders view in place of given element
        *   This function accepts element, model and onChange function
        *   element - html element (place holder) to render a row view
        *   model - row data for rendering name, value etc for given row type
        *   onChange - an onChange event callback funtion to keep track of any change in value
        * @property {function} destroy a callback function when a vue component gets destroyed
    */

    /**
     * Create a new form control definition with a formControlViewProvider
     *      this formControlViewProvider is used inside form overlay to show/render a form row
     *
     * @public
     * @param {String} controlName a form structure, array of section
     * @param {ControlViewProvider} controlViewProvider
     */
    addNewFormControl(controlName, controlViewProvider) {
        this.formController.addControl(controlName, controlViewProvider);
    }

    /**
     * Get a ControlViewProvider for a given/stored form controlName
     *
     * @public
     * @param {String} controlName a form structure, array of section
     * @return {ControlViewProvider}
     */
    getFormControl(controlName) {
        return this.formController.getControl(controlName);
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
     * @public
     * @param {Array<Section>} formStructure a form structure, array of section
     * @param {Object} options
     *      @property {HTMLElement} element Parent Element to render a Form
     *      @property {function} onChange a callback function when any changes detected
     *      @property {function} onSave a callback function when form is submitted
     *      @property {function} onDismiss a callback function when form is dismissed
     */
    showForm(formStructure, {
        element,
        onChange
    } = {}) {
        const changes = {};
        let overlay;
        let onDismiss;
        let onSave;

        const self = this;

        const promise = new Promise((resolve, reject) => {
            onSave = onFormAction(resolve);
            onDismiss = onFormAction(reject);
        });

        const vm = new Vue({
            components: { FormProperties },
            provide: {
                openmct: self.openmct
            },
            data() {
                return {
                    formStructure,
                    onChange: onFormPropertyChange,
                    onDismiss,
                    onSave
                };
            },
            template: '<FormProperties :model="formStructure" @onChange="onChange" @onDismiss="onDismiss" @onSave="onSave"></FormProperties>'
        }).$mount();

        const formElement = vm.$el;
        if (element) {
            element.append(formElement);
        } else {
            overlay = self.openmct.overlays.overlay({
                element: vm.$el,
                size: 'small',
                onDestroy: () => vm.$destroy()
            });
        }

        function onFormPropertyChange(data) {
            self.emit('onFormPropertyChange', data);
            if (onChange) {
                onChange(data);
            }

            if (data.model) {
                const property = data.model.property;
                let key = data.model.key;

                if (property && property.length) {
                    key = property.join('.');
                }

                changes[key] = data.value;
            }
        }

        function onFormAction(callback) {
            return () => {
                if (element) {
                    formElement.remove();
                } else {
                    overlay.dismiss();
                }

                if (callback) {
                    callback(changes);
                }
            };
        }

        return promise;
    }
}
