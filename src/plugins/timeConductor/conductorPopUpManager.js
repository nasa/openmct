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
    showPopup(clickEvent) {
      const isAxis = clickEvent.target.closest('.c-conductor-axis') !== null;

      if (isAxis || this.conductorPopup) {
        return;
      }

      this.showConductorPopup = true;
    },
    positionBox() {
      if (!this.conductorPopup) {
        return;
      }

      const timeConductorOptionsBox = this.timeConductorOptionsHolder.getBoundingClientRect();
      const offsetTop = this.conductorPopup.getBoundingClientRect().height;

      this.positionY = timeConductorOptionsBox.top - offsetTop;
      this.positionX = 0;
    },
    clearPopup() {
      this.showConductorPopup = false;
      this.conductorPopup = null;

      document.removeEventListener('click', this.handleClickAway);
      window.removeEventListener('resize', this.positionBox);
    },
    handleClickAway(clickAwayEvent) {
      if (this.canClose(clickAwayEvent)) {
        clickAwayEvent.stopPropagation();
        this.clearPopup();
      }
    },
    canClose(clickAwayEvent) {
      const isChildMenu = clickAwayEvent.target.closest('.c-menu') !== null;
      const isPopupElementItem = this.timeConductorOptionsHolder.contains(clickAwayEvent.target);

      return !isChildMenu && !isPopupElementItem;
    }
  }
};
