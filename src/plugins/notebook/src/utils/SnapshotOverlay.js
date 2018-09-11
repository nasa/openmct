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
    'vue',
    '../../res/templates/viewSnapshot.html'
], function (
    Vue,
    snapshotOverlayTemplate
) {
    function SnapshotOverlay (embedObject, formatTime) {
        this.embedObject = embedObject;

        this.snapshotOverlayVue = new Vue({
            template: snapshotOverlayTemplate,
            data: function () {
                return {
                    embed: embedObject
                };
            },
            methods: {
                close: this.close.bind(this),
                formatTime: formatTime
            }
        });

        this.open();
    }

    SnapshotOverlay.prototype.open = function () {
        this.overlay = document.createElement('div');
        this.overlay.classList.add('abs');

        document.body.appendChild(this.overlay);

        this.overlay.appendChild(this.snapshotOverlayVue.$mount().$el);
    };

    SnapshotOverlay.prototype.close = function (event) {
        event.stopPropagation();
        this.snapshotOverlayVue.$destroy();
        this.overlay.parentNode.removeChild(this.overlay);
    };

    return SnapshotOverlay;
});
