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
import Select from './Select.js';

/**
 * Create a {Select} element whose composition is dynamically updated with
 * the telemetry fields of a particular domain object
 * @constructor
 * @param {Object} config The current state of this select. Must have object
 *                        and key fields
 * @param {ObjectSelect} objectSelect The linked ObjectSelect instance to which
 *                                    this KeySelect should listen to for change
 *                                    events
 * @param {ConditionManager} manager A ConditionManager instance from which
 *                                   to receive telemetry metadata
 * @param {function} changeCallback A change event callback to register with this
 *                                  select on initialization
 */
const NULLVALUE = '- Select Field -';

export default function KeySelect(config, objectSelect, manager, changeCallback) {
  const self = this;

  this.config = config;
  this.objectSelect = objectSelect;
  this.manager = manager;

  this.select = new Select();
  this.select.hide();
  this.select.addOption('', NULLVALUE);
  if (changeCallback) {
    this.select.on('change', changeCallback);
  }

  /**
   * Change event handler for the {ObjectSelect} to which this KeySelect instance
   * is linked. Loads the new object's metadata and updates its select element's
   * composition.
   * @param {Object} key The key identifying the newly selected domain object
   * @private
   */
  function onObjectChange(key) {
    const selected = self.manager.metadataLoadCompleted()
      ? self.select.getSelected()
      : self.config.key;
    self.telemetryMetadata = self.manager.getTelemetryMetadata(key) || {};
    self.generateOptions();
    self.select.setSelected(selected);
  }

  /**
   * Event handler for the initial metadata load event from the associated
   * ConditionManager. Retrieves metadata from the manager and populates
   * the select element.
   * @private
   */
  function onMetadataLoad() {
    if (self.manager.getTelemetryMetadata(self.config.object)) {
      self.telemetryMetadata = self.manager.getTelemetryMetadata(self.config.object);
      self.generateOptions();
    }

    self.select.setSelected(self.config.key);
  }

  if (self.manager.metadataLoadCompleted()) {
    onMetadataLoad();
  }

  this.objectSelect.on('change', onObjectChange, this);
  this.manager.on('metadata', onMetadataLoad);

  return this.select;
}

/**
 * Populate this select with options based on its current composition
 */
KeySelect.prototype.generateOptions = function () {
  const items = Object.entries(this.telemetryMetadata).map(function (metaDatum) {
    return [metaDatum[0], metaDatum[1].name];
  });
  items.splice(0, 0, ['', NULLVALUE]);
  this.select.setOptions(items);

  if (this.select.options.length < 2) {
    this.select.hide();
  } else if (this.select.options.length > 1) {
    this.select.show();
  }
};

KeySelect.prototype.destroy = function () {
  this.objectSelect.destroy();
};
