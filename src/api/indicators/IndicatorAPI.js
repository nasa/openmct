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

import { EventEmitter } from 'eventemitter3';

import vueWrapHtmlElement from '../../utils/vueWrapHtmlElement.js';
import SimpleIndicator from './SimpleIndicator.js';

/**
 * The Indicator API is used to add indicators to the Open MCT UI.
 * An indicator appears in the top navigation bar and can be used to
 * display information or trigger actions.
 *
 * @extends EventEmitter
 */
class IndicatorAPI extends EventEmitter {
  /** @type {import('../../../openmct.js').OpenMCT} */
  openmct;
  constructor(openmct) {
    super();

    this.openmct = openmct;
    this.indicatorObjects = [];
  }

  getIndicatorObjectsByPriority() {
    const sortedIndicators = this.indicatorObjects.sort((a, b) => b.priority - a.priority);

    return sortedIndicators;
  }

  simpleIndicator() {
    return new SimpleIndicator(this.openmct);
  }

  /**
   * @typedef {import('vue').Component} VueComponent
   */

  /**
   * @typedef {Object} Indicator
   * @property {HTMLElement} [element] - The HTML element of the indicator. Optional if using vueComponent.
   * @property {VueComponent|Promise<VueComponent>} [vueComponent] - The Vue component for the indicator. Optional if using element.
   * @property {string} key - The unique key for the indicator.
   * @property {number} priority - The priority of the indicator (default: -1).
   */

  /**
   * Adds an indicator to the API.
   *
   * @param {Indicator} indicator - The indicator object to add.
   *
   * @description
   * The indicator object is a simple object with two main attributes:
   * - 'element': An HTMLElement (optional if using vueComponent).
   * - 'priority': An integer specifying its order in the layout. Lower priority
   *   places the element further to the right. If undefined, defaults to -1.
   *
   * A convenience function `.simpleIndicator()` is provided to create a default
   * Open MCT indicator that can be passed to `.add(indicator)`. This indicator
   * exposes functions for customizing its appearance and behavior.
   *
   * Example usage:
   * ```
   * const myIndicator = openmct.indicators.simpleIndicator();
   * openmct.indicators.add(myIndicator);
   *
   * myIndicator.text("Hello World!");
   * myIndicator.iconClass("icon-info");
   * ```
   *
   * For Vue components, pass the component directly as the 'vueComponent'
   * attribute. This can be a Vue component or a promise resolving to a
   * Vue component for asynchronous rendering.
   */
  add(indicator) {
    if (!indicator.priority) {
      indicator.priority = this.openmct.priority.DEFAULT;
    }
    if (!indicator.vueComponent) {
      indicator.vueComponent = vueWrapHtmlElement(indicator.element);
    }

    this.indicatorObjects.push(indicator);

    this.emit('addIndicator', indicator);
  }
}

export default IndicatorAPI;
