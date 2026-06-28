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
import { makeKeyString } from 'objectUtils';

import Select from './Select.js';

/**
 * Create a {Select} element whose composition is dynamically updated with
 * the current composition of the Summary Widget
 * @constructor
 * @param {Object} config The current state of this select. Must have an
 *                        object field
 * @param {ConditionManager} manager A ConditionManager instance from which
 *                                   to receive the current composition status
 * @param {string[][]} baseOptions A set of [value, label] keyword pairs to
 *                                 display regardless of the composition state
 */
export default function ObjectSelect(config, manager, baseOptions) {
  const self = this;

  this.config = config;
  this.manager = manager;

  this.select = new Select();
  this.baseOptions = [['', '- Select Telemetry -']];
  if (baseOptions) {
    this.baseOptions = this.baseOptions.concat(baseOptions);
  }

  this.baseOptions.forEach(function (option) {
    self.select.addOption(option[0], option[1]);
  });

  this.compositionObjs = this.manager.getComposition();
  self.generateOptions();

  /**
   * Add a new composition object to this select when a composition added
   * is detected on the Summary Widget
   * @param {Object} obj The newly added domain object
   * @private
   */
  function onCompositionAdd(obj) {
    self.select.addOption(makeKeyString(obj.identifier), obj.name);
  }

  /**
   * Refresh the composition of this select when a domain object is removed
   * from the Summary Widget's composition
   * @private
   */
  function onCompositionRemove() {
    const selected = self.select.getSelected();
    self.generateOptions();
    self.select.setSelected(selected);
  }

  /**
   * Defer setting the selected state on initial load until load is complete
   * @private
   */
  function onCompositionLoad() {
    self.select.setSelected(self.config.object);
  }

  this.manager.on('add', onCompositionAdd);
  this.manager.on('remove', onCompositionRemove);
  this.manager.on('load', onCompositionLoad);

  if (this.manager.loadCompleted()) {
    onCompositionLoad();
  }

  return this.select;
}

/**
 * Populate this select with options based on its current composition
 */
ObjectSelect.prototype.generateOptions = function () {
  const items = Object.values(this.compositionObjs).map(function (obj) {
    return [makeKeyString(obj.identifier), obj.name];
  });
  this.baseOptions.forEach(function (option, index) {
    items.splice(index, 0, option);
  });
  this.select.setOptions(items);
};
