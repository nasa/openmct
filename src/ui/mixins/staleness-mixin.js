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

import StalenessUtils from '@/utils/staleness';

export default {
  data() {
    return {
      isStale: false
    };
  },
  beforeUnmount() {
    this.triggerUnsubscribeFromStaleness();
  },
  methods: {
    subscribeToStaleness(domainObject, callback) {
      if (!this.stalenessUtils) {
        this.stalenessUtils = new StalenessUtils(this.openmct, domainObject);
      }

      this.requestStaleness(domainObject);
      this.unsubscribeFromStaleness = this.openmct.telemetry.subscribeToStaleness(
        domainObject,
        (stalenessResponse) => {
          this.handleStalenessResponse(stalenessResponse, callback);
        }
      );
    },
    async requestStaleness(domainObject) {
      const stalenessResponse = await this.openmct.telemetry.isStale(domainObject);
      if (stalenessResponse !== undefined) {
        this.handleStalenessResponse(stalenessResponse);
      }
    },
    handleStalenessResponse(stalenessResponse, callback) {
      if (this.stalenessUtils.shouldUpdateStaleness(stalenessResponse)) {
        if (typeof callback === 'function') {
          callback(stalenessResponse.isStale);
        } else {
          this.isStale = stalenessResponse.isStale;
        }
      }
    },
    triggerUnsubscribeFromStaleness() {
      if (this.unsubscribeFromStaleness) {
        this.unsubscribeFromStaleness();
        delete this.unsubscribeFromStaleness;
        this.stalenessUtils.destroy();
      }
    }
  }
};
