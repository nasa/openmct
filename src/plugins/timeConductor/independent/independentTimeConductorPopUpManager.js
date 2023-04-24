/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import raf from '@/utils/raf';
import Vue from "vue";
import ConductorPopUp from "../ConductorPopUp.vue";

export default {
    inject: ['openmct'],
    mounted() {
        this.showPopup = this.showPopup.bind(this);
        this.clearPopup = this.clearPopup.bind(this);
        this.positionBox = this.positionBox.bind(this);
        this.positionBox = raf(this.positionBox);
        this.timeConductorOptionsHolder = this.$refs.timeConductorOptionsHolder;
        this.registerPopUp();
        this.popupComponent = this.createPopupComponent();
    },
    methods: {
        showPopup() {
            if (!this.independentTCEnabled) {
                return;
            }

            const popupElement = this.popupComponent;

            document.body.appendChild(popupElement.$el);
            //Use capture, so we don't trigger immediately on the same iteration of the event loop
            document.addEventListener('click', this.clearPopup, {
                capture: true
            });

            this.positionBox();

            window.addEventListener('resize', this.positionBox);
        },

        positionBox() {
            const popupElement = this.popupComponent;
            const timeConductorOptions = this.timeConductorOptionsHolder;

            let timeConductorOptionsBox = timeConductorOptions.getBoundingClientRect();
            popupElement.positionX = timeConductorOptionsBox.left;
            //TODO: PositionY should be calculated to be top or bottom based on the location of the conductor options
            popupElement.positionY = timeConductorOptionsBox.top;
            const offsetTop = popupElement.$el.getBoundingClientRect().height;

            const popupRight = popupElement.positionX + popupElement.$el.clientWidth;
            const offsetLeft = Math.min(window.innerWidth - popupRight, 0);

            popupElement.positionX = popupElement.positionX + offsetLeft;
            popupElement.positionY = popupElement.positionY - offsetTop;
        },

        clearPopup(clickAwayEvent) {
            if (this.canClose(clickAwayEvent)) {
                clickAwayEvent.stopPropagation();
                this.removePopup();
            }
        },
        canClose(clickAwayEvent) {
            const popupElement = this.popupComponent;

            const isChildMenu = clickAwayEvent.target.closest('.c-menu') !== null;
            const isPopupElementItem = popupElement.$el.contains(clickAwayEvent.target);

            return !isChildMenu && !isPopupElementItem;
        },
        removePopup() {
            const popupElement = this.popupComponent;
            document.removeEventListener('click', this.clearPopup, {
                capture: true
            });
            window.removeEventListener('resize', this.positionBox);
            popupElement.$el.remove();
        },

        createPopupComponent() {
            const saveFixedBounds = this.saveFixedBounds;
            const saveClockOffsets = this.saveClockOffsets;
            const saveMode = this.saveMode;
            const removePopup = this.removePopup;

            const popupElement = new Vue({
                components: {
                    ConductorPopUp
                },
                provide: {
                    openmct: this.openmct,
                    configuration: undefined,
                    objectPath: this.objectPath
                },
                data() {
                    return {
                        positionX: 0,
                        positionY: 0,
                        saveClockOffsets,
                        saveFixedBounds,
                        saveMode,
                        removePopup,
                        timeOptions: this.timeOptions
                    };
                },
                template: `<conductor-pop-up 
                    @dismiss="removePopup()" 
                    @modeUpdated="saveMode" 
                    @fixedBoundsUpdated="saveFixedBounds" 
                    @clockOffsetsUpdated="saveClockOffsets" 
                    :is-independent="true"
                    :time-options="timeOptions"
                    :bottom="true" 
                    :positionX="positionX" 
                    :positionY="positionY" />`
            }).$mount();

            return popupElement;
        },

        registerPopUp() {
            this.timeConductorOptionsHolder.addEventListener('click', this.showPopup);
        }
    }
};
