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
import CreateWizard from './CreateWizard';

import FormProperties from './components/FormProperties.vue';

import uuid from 'uuid';
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

        this.parentDomainObject = {};

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

    showForm(formStructure, options) {
        const self = this;
        const changes = {};

        this.parentDomainObject = options.parentDomainObject;
        const domainObject = options.domainObject;
        const isEdit = options.isEdit;
        const onSave = options.onSave;
        const onDismiss = options.onDismiss;

        const vm = new Vue({
            components: { FormProperties },
            provide: {
                openmct: this.openmct
            },
            data() {
                return {
                    formStructure,
                    onChange
                };
            },
            template: '<FormProperties :model="formStructure" @onChange="onChange"></FormProperties>'
        }).$mount();

        let overlay = this.openmct.overlays.overlay({
            element: vm.$el,
            size: 'small',
            buttons: [
                {
                    label: 'OK',
                    emphasis: 'true',
                    callback: () => {
                        overlay.dismiss();
                        if (onSave) {
                            onSave(domainObject, this.parentDomainObject);
                        } else {
                            this.save(domainObject, changes, isEdit);
                        }
                    }
                },
                {
                    label: 'Cancel',
                    callback: () => {
                        overlay.dismiss();

                        if (onDismiss) {
                            onDismiss();
                        }
                    }
                }
            ],
            onDestroy: () => vm.$destroy()
        });

        function onChange(data) {
            if (options.onChange) {
                options.onChange(data);
            }

            const parentDomainObject = data.parentDomainObject;
            if (parentDomainObject) {
                self.parentDomainObject = parentDomainObject;
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
    }

    showEditForm(objectPath) {
        const createWizard = new CreateWizard(this.openmct, objectPath[0], objectPath[1]);
        const formStructure = createWizard.getFormStructure(false);
        formStructure.title = 'Edit ' + objectPath[0].name;

        const options = {
            domainObject: objectPath[0],
            isEdit: true
        };

        this.showForm(formStructure, options);
    }

    showCreateForm(type, parentDomainObject) {
        this.parentDomainObject = parentDomainObject;

        const typeDefinition = this.openmct.types.get(type);
        const definition = typeDefinition.definition;
        const domainObject = {
            type,
            identifier: {
                key: uuid(),
                namespace: parentDomainObject.identifier.namespace
            }
        };

        if (definition.initialize) {
            definition.initialize(domainObject);
        }

        const createWizard = new CreateWizard(this.openmct, domainObject, parentDomainObject);
        const formStructure = createWizard.getFormStructure(true);
        formStructure.title = 'Create a New ' + definition.name;

        const options = {
            domainObject
        };

        this.showForm(formStructure, options);
    }

    async save(domainObject, changes, isEdit) {
        Object.entries(changes).forEach(([key, value]) => {
            const properties = key.split('.');
            let object = domainObject;
            properties.forEach(property => {
                if (typeof object[property] === 'object' && object[property] !== null) {
                    object = object[property];
                } else {
                    object[property] = value;
                }
            });

            object = value;
        });

        domainObject.modified = Date.now();
        domainObject.location = this.openmct.objects.makeKeyString(this.parentDomainObject.identifier);
        domainObject.identifier.namespace = this.parentDomainObject.identifier.namespace;

        console.log(domainObject, changes, this.parentDomainObject);
        let objectSaved = await this.openmct.objects.save(domainObject);

        if (!isEdit && objectSaved) {
            // TODO: call lovator validate if exists
            const compositionCollection = await openmct.composition.get(this.parentDomainObject);
            compositionCollection.add(domainObject);
            this._navigateAndEdit(domainObject);
        }
    }

    // Private methods
    /**
     * @private
     */
    _addDefaultFormControls() {
        CONTROLS.forEach(control => {
            this.addControl(control);
        });
    }

    async _navigateAndEdit(domainObject) {
        const objectPath = await this.openmct.objects.getOriginalPath(domainObject.identifier);

        const url = '#/browse/' + objectPath
                        .slice(1)
                        .map(object => object && this.openmct.objects.makeKeyString(object.identifier.key))
                        .reverse()
                        .join('/');

        window.location.href = url;
        this.openmct.editor.edit();
    }

    // Init
    init() {
        this.openmct.actions.register(new EditPropertiesAction(this.openmct));

        this._addDefaultFormControls();
    }
}
