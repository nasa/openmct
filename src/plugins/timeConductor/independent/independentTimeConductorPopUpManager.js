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
    data() {
        return {
            showConductorPopup: false,
            positionX: 0,
            positionY: 0,
            conductorPopup: null
        };
    },
    mounted() {
        this.positionBox = raf(this.positionBox);
        this.timeConductorOptionsHolder = this.$el;
        this.timeConductorOptionsHolder.addEventListener('click', this.showPopup);
    },
    methods: {
        initializePopup() {
            this.conductorPopup = this.$refs.conductorPopup.$el;
            this.$nextTick(() => {
                window.addEventListener('resize', this.positionBox);
                document.addEventListener('click', this.handleClickAway);
                this.positionBox();
            });
        },
        showPopup() {
            if (this.conductorPopup) {
                return;
            }

            this.showConductorPopup = true;
        },
        handleClickAway(clickAwayEvent) {
            if (this.canClose(clickAwayEvent)) {
                clickAwayEvent.stopPropagation();
                this.clearPopup();
            }
        },
        positionBox() {
            let timeConductorOptionsBox = this.timeConductorOptionsHolder.getBoundingClientRect();
            this.positionX = timeConductorOptionsBox.left;
            //TODO: PositionY should be calculated to be top or bottom based on the location of the conductor options
            this.positionY = timeConductorOptionsBox.top;
            const offsetTop = this.conductorPopup.getBoundingClientRect().height;

            const popupRight = this.positionX + this.conductorPopup.clientWidth;
            const offsetLeft = Math.min(window.innerWidth - popupRight, 0);

            this.positionX = this.positionX + offsetLeft;
            this.positionY = this.positionY - offsetTop;
        },
        clearPopup() {
            this.showConductorPopup = false;
            this.conductorPopup = null;

            document.removeEventListener('click', this.handleClickAway);
            window.removeEventListener('resize', this.positionBox);
        },
        canClose(clickAwayEvent) {
            const isChildMenu = clickAwayEvent.target.closest('.c-menu') !== null;
            const isPopupElementItem = this.timeConductorOptionsHolder.contains(clickAwayEvent.target);

            return !isChildMenu && !isPopupElementItem;
        }
    }
};
