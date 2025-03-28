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

class StalenessUtils {
  constructor(openmct, domainObject) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.metadata = this.openmct.telemetry.getMetadata(domainObject);
    this.lastStalenessResponseTime = 0;

    this.setTimeSystem(this.openmct.time.getTimeSystem());
    this.watchTimeSystem();
    this.timeSystemKey = null;
  }

  shouldUpdateStaleness(stalenessResponse, id) {
    const stalenessResponseTime = this.parseTime(stalenessResponse);
    const { start } = this.openmct.time.getBounds();
    const isStalenessInCurrentClock = stalenessResponseTime > start;

    if (stalenessResponseTime > this.lastStalenessResponseTime && isStalenessInCurrentClock) {
      this.lastStalenessResponseTime = stalenessResponseTime;

      return true;
    } else {
      return false;
    }
  }

  watchTimeSystem() {
    this.openmct.time.on('timeSystem', this.setTimeSystem, this);
  }

  unwatchTimeSystem() {
    this.openmct.time.off('timeSystem', this.setTimeSystem, this);
  }

  setTimeSystem(timeSystem) {
    this.timeSystem = timeSystem;
  }

  parseTime(stalenessResponse) {
    const metadataValue = this.metadata.value(this.timeSystem.key) ?? {
      format: this.timeSystem.key
    };
    const valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

    const stalenessDatum = {
      ...stalenessResponse,
      source: stalenessResponse[this.timeSystem.key]
    };

    return valueFormatter.parse(stalenessDatum);
  }

  destroy() {
    this.unwatchTimeSystem();
  }
}

export default StalenessUtils;
