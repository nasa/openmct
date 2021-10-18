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

import Preview from '@/ui/preview/Preview.vue';

import Vue from 'vue';

export default class ViewLargeAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-items-expand';
        this.description = 'View Large';
        this.group = 'windowing';
        this.key = 'large.view';
        this.name = 'Large View';
        this.priority = 1;
        this.showInStatusBar = true;
    }

    invoke(objectPath, view) {
        const parentElement = view.parentElement;
        let childElement = parentElement && parentElement.firstChild;
        if (!childElement) {
            const message = "ViewLargeAction: missing element";
            this.openmct.notifications.error(message);
            throw new Error(message);
        }

        this._expand(objectPath, childElement);
    }

    appliesTo(objectPath, view = {}) {
        const parentElement = view.parentElement;
        const element = parentElement && parentElement.firstChild;
        const viewLargeAction = element && !element.classList.contains('js-main-container')
            && !this.openmct.router.isNavigatedObject(objectPath);

        return viewLargeAction;
    }

    _expand(objectPath, childElement) {
        const parentElement = childElement.parentElement;

        this.overlay = this.openmct.overlays.overlay({
            element: this._getPreview(objectPath),
            size: 'large',
            autoHide: false,
            onDestroy() {
                parentElement.append(childElement);
            }
        });
    }

    _getPreview(objectPath) {
        const preview = new Vue({
            components: {
                Preview
            },
            provide: {
                openmct: this.openmct,
                objectPath
            },
            template: '<Preview></Preview>'
        });

        return preview.$mount().$el;
    }
}
