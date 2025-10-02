/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import debounce from '@/utils/debounce';
import raf from '@/utils/raf';

export function useIndependentTimeConductorPopUp(component, parentElement, enabled) {
  const showConductorPopup = ref(false);
  const positionX = ref(-10000); // prevents initial flash after appending to body element
  const positionY = ref(0);

  onMounted(() => {
    parentElement.value.addEventListener('click', showPopup);
  });

  onBeforeUnmount(() => {
    parentElement.value.removeEventListener('click', showPopup);
    if (component.value?.conductorPopupElement?.parentNode === document.body) {
      document.body.removeChild(component.value.conductorPopupElement);
      component.value.conductorPopupElement = null;
    }
  });

  const debouncedPositionBox = debounce(raf(positionBox), 250);

  function positionBox() {
    if (!component.value.conductorPopupElement) {
      return;
    }

    const timeConductorOptionsBox = parentElement.value.getBoundingClientRect();
    const topHalf = timeConductorOptionsBox.top < window.innerHeight / 2;
    const padding = 5;
    const offsetTop = component.value.conductorPopupElement.getBoundingClientRect().height;
    const popupRight =
      timeConductorOptionsBox.left + component.value.conductorPopupElement.clientWidth;
    const offsetLeft = Math.min(window.innerWidth - popupRight, 0);

    if (topHalf) {
      positionY.value =
        timeConductorOptionsBox.bottom +
        component.value.conductorPopupElement.clientHeight +
        padding;
    } else {
      positionY.value = timeConductorOptionsBox.top - padding;
    }

    positionX.value = timeConductorOptionsBox.left + offsetLeft;
    positionY.value = positionY.value - offsetTop;
  }

  function initializePopup() {
    // we need to append it the first time since the popup has overflow:hidden
    // then we show/hide based on the flag
    if (component.value.conductorPopupElement.parentNode !== document.body) {
      document.body.appendChild(component.value.conductorPopupElement);
    }
    nextTick(() => {
      window.addEventListener('resize', debouncedPositionBox);
      document.addEventListener('click', handleClickAway);
      debouncedPositionBox();
    });
  }

  function showPopup(clickEvent) {
    const isToggle = clickEvent.target.classList.contains('c-toggle-switch__slider');

    // no current popup,
    // itc toggled,
    // something is emitting a dupe event with pointer id = -1, want to ignore those
    // itc is currently enabled
    if (!isToggle && clickEvent.pointerId !== -1 && enabled.value) {
      showConductorPopup.value = true;
    }
  }

  function handleClickAway(clickEvent) {
    if (canClose(clickEvent)) {
      clearPopup();
    }
  }

  function clearPopup() {
    if (!component.value.conductorPopupElement) {
      return;
    }
    showConductorPopup.value = false;
    positionX.value = -10000; // reset it off screen

    document.removeEventListener('click', handleClickAway);
    window.removeEventListener('resize', debouncedPositionBox);
  }

  function canClose(clickAwayEvent) {
    const isChildMenu = clickAwayEvent.target.closest('.c-menu') !== null;
    const isPopupOrChild = clickAwayEvent.target.closest('.c-tc-input-popup') !== null;
    const isTimeConductor = parentElement.value.contains(clickAwayEvent.target);
    const isToggle = clickAwayEvent.target.classList.contains('c-toggle-switch__slider');

    return !isTimeConductor && !isChildMenu && !isToggle && !isPopupOrChild;
  }

  return {
    showConductorPopup,
    positionX,
    positionY,
    initializePopup,
    clearPopup
  };
}
