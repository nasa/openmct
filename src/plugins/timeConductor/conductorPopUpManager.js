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

export default {
    inject: ['openmct', 'configuration'],
    data() {
        return {
            showConductorPopup: false,
            positionX: 0,
            positionY: 0
        };
    },
    mounted() {
        this.showPopup = this.showPopup.bind(this);
        this.clearPopup = this.clearPopup.bind(this);
        this.positionBox = this.positionBox.bind(this);
        this.positionBox = raf(this.positionBox);
        this.timeConductorOptionsHolder = this.$refs.timeConductorOptionsHolder;
        this.showConductorPopup = false;
        this.registerPopUp();
        // this.popupComponent = this.createPopupComponent();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.positionBox);
        document.removeEventListener('click', this.clearPopup);
        this.timeConductorOptionsHolder.removeEventListener('click', this.showPopup);
    },
    methods: {
        showPopup() {
            if (this.showConductorPopup) {
                return;
            }

            this.showConductorPopup = true;

            this.positionBox();

            // setTimeout so we don't trigger immediately on the same iteration of the event loop
            // using capture, was preventing the dropdown menues from disappearing with
            // the conductor popup, requiring an extra click and floating dropdown
            setTimeout(() => {
                window.addEventListener('resize', this.positionBox);
                document.addEventListener('click', this.clearPopup);
            }, 0);
        },

        positionBox() {
            // const popupElement = this.popupComponent;
            const timeConductorOptions = this.timeConductorOptionsHolder;

            let timeConductorOptionsBox = timeConductorOptions.getBoundingClientRect();
            this.positionX = timeConductorOptionsBox.left;
            //TODO: PositionY should be calculated to be top or bottom based on the location of the conductor options
            this.positionY = timeConductorOptionsBox.top;
            const offsetTop = this.$refs.conductorPopup.$el.getBoundingClientRect().height;

            const popupRight = this.positionX + this.$refs.conductorPopup.$el.clientWidth;
            const offsetLeft = Math.min(window.innerWidth - popupRight, 0);

            this.positionX = this.positionX + offsetLeft;
            this.positionY = this.positionY - offsetTop;
            console.log('position xy', this.positionX, this.positionY);
        },

        clearPopup(clickAwayEvent) {
            if (this.canClose(clickAwayEvent)) {
                clickAwayEvent.stopPropagation();
                this.showConductorPopup = false;

                document.removeEventListener('click', this.clearPopup);
                window.removeEventListener('resize', this.positionBox);
            }
        },
        canClose(clickAwayEvent) {
            // const popupElement = this.popupComponent;

            const isChildMenu = clickAwayEvent.target.closest('.c-menu') !== null;
            const isPopupElementItem = this.$refs.conductorPopup.$el.contains(clickAwayEvent.target);

            return !isChildMenu && !isPopupElementItem;
        },
        registerPopUp() {
            this.timeConductorOptionsHolder.addEventListener('click', this.showPopup);
        }
    }
};
