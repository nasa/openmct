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

import ConditionManager from './ConditionManager.js';

export default class ConditionSetTelemetryProvider {
  constructor(openmct) {
    this.openmct = openmct;
    this.conditionManagerPool = {};
    this.lastEmittedById = new Map();
  }

  isTelemetryObject(domainObject) {
    return domainObject.type === 'conditionSet';
  }

  supportsRequest(domainObject) {
    return domainObject.type === 'conditionSet';
  }

  supportsSubscribe(domainObject) {
    return domainObject.type === 'conditionSet';
  }

  async request(domainObject, options) {
    let conditionManager = this.getConditionManager(domainObject);
    const formattedHistoricalData = await conditionManager.getHistoricalData(options);
    let latestOutput = await conditionManager.requestLADConditionSetOutput(options);

    // Avoid duplicate timestamps when historical data includes the latest point.
    // Prefer LAD output when it overlaps, since it reflects the current evaluation path.
    const timeKey = this.openmct.time.getTimeSystem().key;
    const merged = [...formattedHistoricalData];

    if (latestOutput?.length) {
      const lad = latestOutput[0];
      const ladTs = lad?.[timeKey];

      if (ladTs !== undefined) {
        const existingIndex = merged.findIndex((d) => d?.[timeKey] === ladTs);

        if (existingIndex >= 0) {
          merged[existingIndex] = lad;
        } else {
          merged.push(lad);
        }
      } else {
        merged.push(lad);
      }
    }

    // Seed subscribe-side dedupe with whatever we returned from request()
    const id = this.openmct.objects.makeKeyString(domainObject.identifier);
    if (merged.length) {
      this.lastEmittedById.set(id, merged[merged.length - 1]);
    }

    return merged;
  }

  subscribe(domainObject, callback) {
    let conditionManager = this.getConditionManager(domainObject);
    const id = this.openmct.objects.makeKeyString(domainObject.identifier);

    const handler = (data) => {
      const timeKey = this.openmct.time.getTimeSystem().key;
      const last = this.lastEmittedById.get(id);
      const sameTime = last?.[timeKey] !== undefined && last?.[timeKey] === data?.[timeKey];
      const sameValue =
        last?.output === data?.output &&
        last?.result === data?.result &&
        last?.conditionId === data?.conditionId &&
        last?.isDefault === data?.isDefault;

      if (sameTime && sameValue) {
        return;
      }

      this.lastEmittedById.set(id, data);
      callback(data);
    };

    conditionManager.on('conditionSetResultUpdated', handler);

    return this.destroyConditionManager.bind(
      this,
      this.openmct.objects.makeKeyString(domainObject.identifier)
    );
  }

  /**
   * returns conditionManager instance for corresponding domain object
   * creates the instance if it is not yet created
   * @private
   */
  getConditionManager(domainObject) {
    const id = this.openmct.objects.makeKeyString(domainObject.identifier);

    if (!this.conditionManagerPool[id]) {
      this.conditionManagerPool[id] = new ConditionManager(domainObject, this.openmct);
    }

    return this.conditionManagerPool[id];
  }

  /**
   * cleans up and destroys conditionManager instance for corresponding domain object id
   * can be called manually for views that only request but do not subscribe to data
   */
  destroyConditionManager(id) {
    if (this.conditionManagerPool[id]) {
      this.conditionManagerPool[id].off('conditionSetResultUpdated');
      this.conditionManagerPool[id].destroy();
      delete this.conditionManagerPool[id];
    }

    this.lastEmittedById.delete(id);
  }
}
