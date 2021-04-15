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

export default class EditPropertiesAction extends PropertiesAction {
    constructor(openmct) {
        super(openmct);

        this.name = 'Edit Properties...';
        this.key = 'properties';
        this.description = 'Edit properties of this object.';
        this.cssClass = 'major icon-pencil';
        this.hideInDefaultMenu = true;
        this.group= 'action';
        this.priority= 10;
    }

    appliesTo(objectPath) {
        return Boolean(this._getForm(objectPath));
    }

    invoke(objectPath) {
        const formElements = this._getFormElements(objectPath);

// Start:Testing
const parent = document.createElement('div');
formElements.forEach(e => {
    const child = document.createElement('div');
    const spanKey = document.createElement('span');
    const spanValue = document.createElement('span');

    spanKey.textContent = e.key;
    spanValue.textContent = e.value;
    child.appendChild(spanKey);
    child.appendChild(spanValue);
    parent.appendChild(child);
});
// End:Testing

        let overlay = this.openmct.overlays.overlay({
            element: parent,   //TODO: create and show new form component
            size: 'small',
            buttons: [
                {
                    label: 'Done',
                    // TODO: save form values into domain object properties
                    callback: () => overlay.dismiss()
                }
            ],
            onDestroy: () => {
            }
        });
    }
}
