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

import SummaryWidgetCondition from './SummaryWidgetCondition.js';

/**
 * Represents a SummaryWidgetRule.
 *
 * @param {Object} definition - The rule definition.
 * @constructor
 */
function SummaryWidgetRule(definition) {
  /**
   * The name of the rule.
   * @type {string}
   */
  this.name = definition.name;

  /**
   * The label of the rule.
   * @type {string}
   */
  this.label = definition.label;

  /**
   * The ID of the rule.
   * @type {string}
   */
  this.id = definition.id;

  /**
   * The icon of the rule.
   * @type {string}
   */
  this.icon = definition.icon;

  /**
   * The style of the rule.
   * @type {string}
   */
  this.style = definition.style;

  /**
   * The message of the rule.
   * @type {string}
   */
  this.message = definition.message;

  /**
   * The description of the rule.
   * @type {string}
   */
  this.description = definition.description;

  /**
   * The conditions of the rule.
   * @type {SummaryWidgetCondition[]}
   */
  this.conditions = definition.conditions.map(function (cDefinition) {
    return new SummaryWidgetCondition(cDefinition);
  });

  /**
   * The trigger type of the rule.
   * @type {string}
   */
  this.trigger = definition.trigger;
}

/**
 * Evaluate the given rule against a telemetryState and return true if it matches.
 *
 * @param {Object} telemetryState - The telemetry state.
 * @returns {boolean} - True if the rule matches, false otherwise.
 */
SummaryWidgetRule.prototype.evaluate = function (telemetryState) {
  let i;
  let result;

  if (this.trigger === 'all') {
    for (i = 0; i < this.conditions.length; i++) {
      result = this.conditions[i].evaluate(telemetryState);
      if (!result) {
        return false;
      }
    }

    return true;
  } else if (this.trigger === 'any') {
    for (i = 0; i < this.conditions.length; i++) {
      result = this.conditions[i].evaluate(telemetryState);
      if (result) {
        return true;
      }
    }

    return false;
  } else {
    throw new Error('Invalid rule trigger: ' + this.trigger);
  }
};

export default SummaryWidgetRule;
