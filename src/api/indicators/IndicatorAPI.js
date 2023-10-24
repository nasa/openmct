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

import EventEmitter from 'EventEmitter';

import SimpleIndicator from './SimpleIndicator';

class IndicatorAPI extends EventEmitter {
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
   * Accepts an indicator object, which is a simple object
   * with a two attributes: 'element' which has an HTMLElement
   * as its value, and 'priority' with an integer that specifies its order in the layout.
   * The lower the priority, the further to the right the element is placed.
   * If undefined, the priority will be assigned -1.
   *
   * We provide .simpleIndicator() as a convenience function
   * which will create a default Open MCT indicator that can
   * be passed to .add(indicator). This indicator also exposes
   * functions for changing its appearance to support customization
   * and dynamic behavior.
   *
   * Eg.
   * const myIndicator = openmct.indicators.simpleIndicator();
   * openmct.indicators.add(myIndicator);
   *
   * myIndicator.text("Hello World!");
   * myIndicator.iconClass("icon-info");
   *
   */
  add(indicator) {
    if (!indicator.priority) {
      indicator.priority = this.openmct.priority.DEFAULT;
    }

    this.indicatorObjects.push(indicator);

    this.emit('addIndicator', indicator);
  }
}

export default IndicatorAPI;
