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
    this.subscribers = {};
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
    let latestOutput = await conditionManager.requestLADConditionSetOutput(options);
    return latestOutput;
  }

  subscribe(domainObject, callback) {
    const id = this.openmct.objects.makeKeyString(domainObject.identifier);
    let subscription = this.subscribers[id];
    if (!subscription) {
      subscription = {
        conditionManager: new ConditionManager(domainObject, this.openmct),
        callbacks: [],
        destroy: undefined
      };
      this.subscribers[id] = subscription;
      function informAllSubscribers(data) {
        subscription.callbacks.forEach((cb) => cb(data));
      }
      subscription.conditionManager.on('conditionSetResultUpdated', informAllSubscribers);
      subscription.destroy = () => {
        subscription.conditionManager.off('conditionSetResultUpdated', informAllSubscribers);
        delete this.subscribers[id];
      };
    }
    subscription.callbacks.push(callback);
    return () => {
      subscription.callbacks = subscription.callbacks.filter((s) => s !== callback);
      if (subscription.callbacks.length === 0) {
        subscription.destroy();
      }
    };
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
  }
}
