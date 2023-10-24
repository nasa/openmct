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
import debounce from '@/utils/debounce';
import raf from '@/utils/raf';

export default {
  data() {
    return {
      showConductorPopup: false,
      positionX: -10000, // prevents initial flash after appending to body element
      positionY: 0,
      conductorPopup: null
    };
  },
  beforeUnmount() {
    if (this.conductorPopup && this.conductorPopup.parentNode === document.body) {
      document.body.removeChild(this.conductorPopup);
      this.conductorPopup = null;
    }
  },
  mounted() {
    this.positionBox = debounce(raf(this.positionBox), 250);
    this.timeConductorOptionsHolder = this.$el;
    this.timeConductorOptionsHolder.addEventListener('click', this.showPopup);
  },
  methods: {
    initializePopup() {
      this.conductorPopup = this.$refs.conductorPopup.$el;
      // we need to append it the first time since the popup has overflow:hidden
      // then we show/hide based on the flag
      if (this.conductorPopup.parentNode !== document.body) {
        document.body.appendChild(this.conductorPopup);
      }
      this.$nextTick(() => {
        window.addEventListener('resize', this.positionBox);
        document.addEventListener('click', this.handleClickAway);
        this.positionBox();
      });
    },
    showPopup(clickEvent) {
      const isToggle = clickEvent.target.classList.contains('c-toggle-switch__slider');

      // no current popup,
      // itc toggled,
      // something is emitting a dupe event with pointer id = -1, want to ignore those
      // itc is currently enabled
      if (!isToggle && clickEvent.pointerId !== -1 && this.independentTCEnabled) {
        this.showConductorPopup = true;
      }
    },
    handleClickAway(clickEvent) {
      if (this.canClose(clickEvent)) {
        this.clearPopup();
      }
    },
    positionBox() {
      if (!this.conductorPopup) {
        return;
      }

      const timeConductorOptionsBox = this.timeConductorOptionsHolder.getBoundingClientRect();
      const topHalf = timeConductorOptionsBox.top < window.innerHeight / 2;
      const padding = 5;
      const offsetTop = this.conductorPopup.getBoundingClientRect().height;
      const popupRight = timeConductorOptionsBox.left + this.conductorPopup.clientWidth;
      const offsetLeft = Math.min(window.innerWidth - popupRight, 0);

      if (topHalf) {
        this.positionY =
          timeConductorOptionsBox.bottom + this.conductorPopup.clientHeight + padding;
      } else {
        this.positionY = timeConductorOptionsBox.top - padding;
      }

      this.positionX = timeConductorOptionsBox.left + offsetLeft;
      this.positionY = this.positionY - offsetTop;
    },
    clearPopup() {
      if (!this.conductorPopup) {
        return;
      }
      this.showConductorPopup = false;
      this.positionX = -10000; // reset it off screen

      document.removeEventListener('click', this.handleClickAway);
      window.removeEventListener('resize', this.positionBox);
    },
    canClose(clickAwayEvent) {
      const isChildMenu = clickAwayEvent.target.closest('.c-menu') !== null;
      const isPopupOrChild = clickAwayEvent.target.closest('.c-tc-input-popup') !== null;
      const isTimeConductor = this.timeConductorOptionsHolder.contains(clickAwayEvent.target);
      const isToggle = clickAwayEvent.target.classList.contains('c-toggle-switch__slider');

      return !isTimeConductor && !isChildMenu && !isToggle && !isPopupOrChild;
    }
  }
};
