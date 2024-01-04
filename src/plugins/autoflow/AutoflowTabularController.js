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

import AutoflowTabularRowController from './AutoflowTabularRowController.js';

/**
 * Controller for an Autoflow Tabular View. Subscribes to telemetry
 * associated with children of the domain object and passes that
 * information on to the view.
 */
class AutoflowTabularController {
  /**
   * Initialize the AutoflowTabularController.
   * @param {DomainObject} domainObject - The object being viewed.
   * @param {*} data - The view data.
   * @param {*} openmct - A reference to the OpenMCT application.
   */
  constructor(domainObject, data, openmct) {
    this.composition = openmct.composition.get(domainObject);
    this.data = data;
    this.openmct = openmct;

    this.rows = {};
    this.controllers = {};

    this.addRow = this.addRow.bind(this);
    this.removeRow = this.removeRow.bind(this);
  }

  /**
   * Set the "Last Updated" value to be displayed.
   * @param {String} value - The value to display.
   * @private
   */
  trackLastUpdated(value) {
    this.data.updated = value;
  }

  /**
   * Respond to an `add` event from composition by adding a new row.
   * @param {Object} childObject - The child domain object to add.
   * @private
   */
  addRow(childObject) {
    const identifier = childObject.identifier;
    const id = [identifier.namespace, identifier.key].join(':');

    if (!this.rows[id]) {
      this.rows[id] = {
        classes: '',
        name: childObject.name,
        value: undefined
      };
      this.controllers[id] = new AutoflowTabularRowController(
        childObject,
        this.rows[id],
        this.openmct,
        this.trackLastUpdated.bind(this)
      );
      this.controllers[id].activate();
      this.data.items.push(this.rows[id]);
    }
  }

  /**
   * Respond to a `remove` event from composition by removing any related row.
   * @param {Object} identifier - The identifier of the object to remove.
   * @private
   */
  removeRow(identifier) {
    const id = [identifier.namespace, identifier.key].join(':');

    if (this.rows[id]) {
      this.data.items = this.data.items.filter((item) => item !== this.rows[id]);
      this.controllers[id].destroy();
      delete this.controllers[id];
      delete this.rows[id];
    }
  }

  /**
   * Activate this controller; begin listening for changes.
   */
  activate() {
    this.composition.on('add', this.addRow);
    this.composition.on('remove', this.removeRow);
    this.composition.load();
  }

  /**
   * Destroy this controller; detach any associated resources.
   */
  destroy() {
    Object.keys(this.controllers).forEach((id) => {
      this.controllers[id].destroy();
    });
    this.controllers = {};
    this.composition.off('add', this.addRow);
    this.composition.off('remove', this.removeRow);
  }
}

export default AutoflowTabularController;
