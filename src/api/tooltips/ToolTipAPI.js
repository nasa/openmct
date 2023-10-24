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

import Tooltip from './ToolTip';

/**
 * @readonly
 * @enum {String} TooltipLocation
 * @property {String} ABOVE The string for locating tooltips above an element
 * @property {String} BELOW The string for locating tooltips below an element
 * @property {String} RIGHT The pixel-spatial annotation type
 * @property {String} LEFT The temporal annotation type
 * @property {String} CENTER The plot-spatial annotation type
 */
const TOOLTIP_LOCATIONS = Object.freeze({
  ABOVE: 'above',
  BELOW: 'below',
  RIGHT: 'right',
  LEFT: 'left',
  CENTER: 'center'
});

/**
 * The TooltipAPI is responsible for adding custom tooltips to
 * the desired elements on the screen
 *
 * @memberof api/tooltips
 * @constructor
 */

class TooltipAPI {
  constructor() {
    this.activeToolTips = [];
    this.TOOLTIP_LOCATIONS = TOOLTIP_LOCATIONS;
  }

  /**
   * @private for platform-internal use
   */
  showTooltip(tooltip) {
    this.removeAllTooltips();
    this.activeToolTips.push(tooltip);
    tooltip.show();
  }

  /**
   * API method to allow for removing all tooltips
   */
  removeAllTooltips() {
    if (!this.activeToolTips?.length) {
      return;
    }
    for (let i = this.activeToolTips.length - 1; i > -1; i--) {
      this.activeToolTips[i].destroy();
      this.activeToolTips.splice(i, 1);
    }
  }

  /**
   * A description of option properties that can be passed into the tooltip
   * @typedef {Object} TooltipOptions
   * @property {string} tooltipText text to show in the tooltip
   * @property {TOOLTIP_LOCATIONS} tooltipLocation location to show the tooltip relative to the parentElement
   * @property {HTMLElement} parentElement reference to the DOM node we're adding the tooltip to
   */

  /**
   * Tooltips take an options object that consists of the string, tooltipLocation, and parentElement
   * @param {TooltipOptions} options
   */
  tooltip(options) {
    let tooltip = new Tooltip(options);

    this.showTooltip(tooltip);

    return tooltip;
  }
}

export default TooltipAPI;
