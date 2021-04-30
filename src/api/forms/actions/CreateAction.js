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
import PropertiesAction from './PropertiesAction';
import CreateWizard from '../CreateWizard';

import uuid from 'uuid';

export default class CreateAction extends PropertiesAction {
    constructor(openmct, type, parentDomainObject) {
        super(openmct);

        this.type = type;
        this.parentDomainObject = parentDomainObject;
        this.formProperties = {};
    }

    invoke() {
        this._showCreateForm(this.type, this.parentDomainObject);
    }

    // Private methods

    _onChange(data) {
        if (data.model) {
            const property = data.model.property;
            let key = data.model.key;
            if (property && property.length) {
                key = property.join('.');
            }

            this.formProperties[key] = data.value;
        }
    }

    async _onSave(domainObject, parentDomainObject) {
        Object.entries(this.formProperties).forEach(([key, value]) => {
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

        // Show saving progress dialog
        let dialog = this.openmct.overlays.progressDialog({
            progressPerc: 'unknown',
            message: 'Do not navigate away from this page or close this browser tab while this message is displayed.',
            iconClass: 'info',
            title: 'Saving'
        });

        const success = await this.openmct.objects.save(domainObject);
        if (success) {
            const compositionCollection = await openmct.composition.get(this.parentDomainObject);
            compositionCollection.add(domainObject);

            this._navigateAndEdit(domainObject);

            this.openmct.notifications.info('Save successful');
        } else {
            this.openmct.notifications.error('Error saving objects');
            console.error(error);
        }
        dialog.dismiss();
    }

    async _navigateAndEdit(domainObject) {
        const objectPath = await this.openmct.objects.getOriginalPath(domainObject.identifier);

        const url = '#/browse/' + objectPath
            .map(object => object && this.openmct.objects.makeKeyString(object.identifier.key))
            .reverse()
            .join('/');

        window.location.href = url;

        const objectView = openmct.objectViews.get(domainObject, objectPath)[0];
        const canEdit = objectView && objectView.canEdit && objectView.canEdit(domainObject, objectPath);
        if (canEdit) {
            openmct.editor.edit();
        }
    }

    _showCreateForm(type, parentDomainObject) {
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

        this.domainObject = domainObject;

        if (definition.initialize) {
            definition.initialize(domainObject);
        }

        const createWizard = new CreateWizard(this.openmct, domainObject, parentDomainObject);
        const formStructure = createWizard.getFormStructure(true);
        formStructure.title = 'Create a New ' + definition.name;

        const options = {
            domainObject,
            onSave: this._onSave.bind(this),
            onChange: this._onChange.bind(this),
        };

        this.openmct.forms.showForm(formStructure, options);
    }
}
