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

export default class AbstractStatusIndicator {
  #popupComponent;
  #indicator;
  #configuration;

  /**
   * @param {*} openmct the Open MCT API (proper typescript doc to come)
   * @param {import('@/api/user/UserAPI').UserAPIConfiguration} configuration Per-deployment status styling. See the type definition in UserAPI
   */
  constructor(openmct, configuration) {
    this.openmct = openmct;
    this.#configuration = configuration;

    this.showPopup = this.showPopup.bind(this);
    this.clearPopup = this.clearPopup.bind(this);
    this.positionBox = this.positionBox.bind(this);
    this.positionBox = raf(this.positionBox);

    this.#indicator = this.createIndicator();
    this.#popupComponent = this.createPopupComponent();
  }

  install() {
    this.openmct.indicators.add(this.#indicator);
  }

  showPopup() {
    const popupElement = this.getPopupElement();

    document.body.appendChild(popupElement.$el);
    //Use capture so we don't trigger immediately on the same iteration of the event loop
    document.addEventListener('click', this.clearPopup, {
      capture: true
    });

    this.positionBox();

    window.addEventListener('resize', this.positionBox);
  }

  positionBox() {
    const popupElement = this.getPopupElement();
    const indicator = this.getIndicator();

    let indicatorBox = indicator.element.getBoundingClientRect();
    popupElement.positionX = indicatorBox.left;
    popupElement.positionY = indicatorBox.bottom;

    const popupRight = popupElement.positionX + popupElement.$el.clientWidth;
    const offsetLeft = Math.min(window.innerWidth - popupRight, 0);
    popupElement.positionX = popupElement.positionX + offsetLeft;
  }

  clearPopup(clickAwayEvent) {
    const popupElement = this.getPopupElement();

    if (!popupElement.$el.contains(clickAwayEvent.target)) {
      popupElement.$el.remove();
      document.removeEventListener('click', this.clearPopup);
      window.removeEventListener('resize', this.positionBox);
    }
  }

  createPopupComponent() {
    throw new Error('Must override createPopupElement method');
  }

  getPopupElement() {
    return this.#popupComponent;
  }

  createIndicator() {
    throw new Error('Must override createIndicator method');
  }

  getIndicator() {
    return this.#indicator;
  }

  getConfiguration() {
    return this.#configuration;
  }
}
