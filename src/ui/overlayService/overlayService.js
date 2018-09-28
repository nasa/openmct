/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    './overlay.vue',
    'vue'
], function (
    OverlayComponent,
    Vue
) {

    function OverlayService() {
        this.activeOverlays = [];
        this.overlayId = 0;
        this.onDestroyCallbacks = {};
    }

    OverlayService.prototype.show  = function (element, onDestroyCallback) {
        if(this.activeOverlays.length) {
            this.activeOverlays[this.activeOverlays.length - 1].overlay.classList.add('invisible');
        }

        this.overlay = document.createElement('div');
        this.overlay.classList.add('abs');

        document.body.appendChild(this.overlay);

        this.component = new Vue({
            provide: {
                destroy: this.destroy.bind(this),
                element: element
            },
            components: {
                OverlayComponent: OverlayComponent.default
            },
            template: '<overlay-component></overlay-component>'
        });

        this.overlay.appendChild(this.component.$mount().$el);

        this.activeOverlays.push({
            overlay: this.overlay,
            component: this.component,
            id: this.overlayId
        });

        if (onDestroyCallback && typeof onDestroyCallback === 'function') {
            console.log(onDestroyCallback);
            this.onDestroyCallbacks[this.overlayId] = onDestroyCallback;
        }
    };

    OverlayService.prototype.destroy = function () {
        var lastActiveOverlayObject = this.activeOverlays.pop(),
            lastActiveOverlay = lastActiveOverlayObject.overlay,
            lastActiveComponent = lastActiveOverlayObject.component;

        if (this.onDestroyCallbacks[lastActiveOverlayObject.id]) {
            this.onDestroyCallbacks[lastActiveOverlayObject.id]();
        }

        lastActiveComponent.$destroy(true);
        document.body.removeChild(lastActiveOverlay);

        if (this.activeOverlays.length) {
            this.activeOverlays[this.activeOverlays.length - 1].overlay.classList.remove('invisible');
        }
    };

    return OverlayService;
});
