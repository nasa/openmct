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

import { isProxy, toRaw } from 'vue';

import StalenessUtils from '@/utils/staleness';

export default {
  data() {
    return {
      staleObjects: [],
      stalenessSubscription: {},
      compositionObjectMap: new Map(),
      setupClockChanged: false
    };
  },
  computed: {
    isStale() {
      return this.staleObjects.length !== 0;
    }
  },
  methods: {
    getSubscriptionId(domainObject) {
      return this.openmct?.objects.makeKeyString(domainObject.identifier);
    },
    setupClockChangedEvent(callback) {
      this.setupClockChanged = true;
      this.compositionIteratorCallback = this.compositionIterator(callback);
      this.openmct.time.on('clockChanged', this.compositionIteratorCallback);
    },
    addToCompositionMap(id, domainObject) {
      if (!this.compositionObjectMap.get(id)) {
        this.compositionObjectMap.set(id, domainObject);
      }
    },
    compositionIterator(callback) {
      return () => {
        this.staleObjects = [];
        for (const [, object] of this.compositionObjectMap) {
          let domainObject = object;
          if (isProxy(domainObject)) {
            domainObject = toRaw(object);
          }
          if (callback && typeof callback === 'function') {
            callback(domainObject);
          }
        }
      };
    },
    subscribeToStaleness(domainObjectList, callback) {
      if (domainObjectList === null || domainObjectList === undefined) {
        return;
      }
      if (!Array.isArray(domainObjectList)) {
        domainObjectList = [domainObjectList];
      }

      domainObjectList.forEach((domainObject) => {
        if (isProxy(domainObject)) {
          domainObject = toRaw(domainObject);
        }
        const id = this.getSubscriptionId(domainObject);
        this.addToCompositionMap(id, domainObject);
        this.setupStalenessUtils(domainObject);
        this.requestStaleness(domainObject, callback);
        this.setupStalenessSubscription(domainObject, callback);
      });
    },
    triggerUnsubscribeFromStaleness(domainObjectList, callback) {
      if (domainObjectList === null || domainObjectList === undefined) {
        return;
      }
      if (!Array.isArray(domainObjectList)) {
        domainObjectList = [domainObjectList];
      }

      domainObjectList.forEach((domainObject) => {
        if (isProxy(domainObject)) {
          domainObject = toRaw(domainObject);
        }
        const id = this.getSubscriptionId(domainObject);
        if (!this.stalenessSubscription[id]) {
          return;
        }
        if (this.staleObjects.length !== 0) {
          const SKIP_CHECK = true;
          this.handleStalenessResponse(id, { isStale: false }, SKIP_CHECK);
        }
        this.teardownStalenessSubscription(domainObject);
        this.teardownStalenessUtils(domainObject);
        delete this.stalenessSubscription[id];
      });

      if (callback && typeof callback === 'function') {
        callback();
      }
    },
    setupStalenessUtils(domainObject) {
      const id = this.getSubscriptionId(domainObject);
      if (this.stalenessSubscription[id]) {
        return;
      }
      this.stalenessSubscription[id] = {};
      this.stalenessSubscription[id].stalenessUtils = new StalenessUtils(
        this.openmct,
        domainObject
      );
    },
    teardownStalenessUtils(domainObject) {
      const id = this.getSubscriptionId(domainObject);
      const { stalenessUtils } = this.stalenessSubscription[id];
      if (stalenessUtils) {
        stalenessUtils.destroy();
        delete this.stalenessSubscription[id].stalenessUtils;
      }
    },
    setupStalenessSubscription(domainObject, callback) {
      const id = this.getSubscriptionId(domainObject);
      this.stalenessSubscription[id].unsubscribe = this.openmct.telemetry.subscribeToStaleness(
        domainObject,
        (stalenessResponse) => {
          const SKIP_CHECK = false;
          this.handleStalenessResponse(id, stalenessResponse, SKIP_CHECK, callback);
        }
      );
    },
    teardownStalenessSubscription(domainObject) {
      const id = this.getSubscriptionId(domainObject);
      const { unsubscribe } = this.stalenessSubscription[id];
      if (unsubscribe) {
        unsubscribe();
        delete this.stalenessSubscription[id].unsubscribe;
      }
    },
    resubscribeToStaleness(domainObject, callback, unsubscribeCallback) {
      const id = this.getSubscriptionId(domainObject);
      this.stalenessSubscription[id].resubscribe = () => {
        this.staleObjects = [];
        this.triggerUnsubscribeFromStaleness(domainObject, unsubscribeCallback);
        this.setupStalenessSubscription(domainObject, callback);
      };
    },
    async requestStaleness(domainObject, callback) {
      const id = this.getSubscriptionId(domainObject);
      const stalenessResponse = await this.openmct.telemetry.isStale(domainObject);
      if (stalenessResponse !== undefined) {
        const SKIP_CHECK = false;
        this.handleStalenessResponse(id, stalenessResponse, SKIP_CHECK, callback);
      }
    },
    handleStalenessResponse(id, stalenessResponse, skipCheck, callback) {
      if (!id) {
        id = Object.keys(this.stalenessSubscription)[0];
      }
      const shouldUpdateStaleness =
        this.stalenessSubscription[id].stalenessUtils.shouldUpdateStaleness(stalenessResponse);
      if (skipCheck || shouldUpdateStaleness) {
        if (callback && typeof callback === 'function') {
          callback(stalenessResponse);
        } else {
          this.addOrRemoveStaleObject(id, stalenessResponse);
        }
      }
    },
    addOrRemoveStaleObject(id, stalenessResponse) {
      const index = this.staleObjects.indexOf(id);
      if (stalenessResponse.isStale) {
        if (index === -1) {
          this.staleObjects.push(id);
        }
      } else {
        if (index !== -1) {
          this.staleObjects.splice(index, 1);
        }
      }
    }
  },
  unmounted() {
    let compositionObjects = [];
    for (const [, object] of this.compositionObjectMap) {
      compositionObjects.push(object);
    }
    this.triggerUnsubscribeFromStaleness(compositionObjects);

    if (this.setupClockChanged) {
      this.openmct.time.off('clockChanged', this.compositionIteratorCallback);
      this.setupClockChanged = false;
    }
  }
};
