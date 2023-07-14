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

const tooltipHelpers = {
  methods: {
    async getTelemetryPathString(telemetryIdentifier) {
      let telemetryPathString = '';
      if (!this.domainObject?.identifier) {
        return;
      }
      const telemetryPath = await this.openmct.objects.getTelemetryPath(
        this.domainObject.identifier,
        telemetryIdentifier
      );
      if (telemetryPath.length) {
        telemetryPathString = telemetryPath.join(' / ');
      }
      return telemetryPathString;
    },
    async getObjectPath(objectIdentifier) {
      if (!objectIdentifier && !this.domainObject) {
        return;
      }
      const domainObjectIdentifier = objectIdentifier || this.domainObject.identifier;
      const objectPathList = await this.openmct.objects.getOriginalPath(domainObjectIdentifier);
      objectPathList.pop();
      return objectPathList
        .map((pathItem) => pathItem.name)
        .reverse()
        .join(' / ');
    },
    buildToolTip(tooltipText, tooltipLocation, elementRef) {
      if (!tooltipText || tooltipText.length < 1) {
        return;
      }
      let parentElement = this.$refs[elementRef];
      if (Array.isArray(parentElement)) {
        parentElement = parentElement[0];
      }
      this.tooltip = this.openmct.tooltips.tooltip({
        toolTipText: tooltipText,
        toolTipLocation: tooltipLocation,
        parentElement: parentElement
      });
    },
    hideToolTip() {
      this.tooltip?.destroy();
      this.tooltip = null;
    }
  }
};

export default tooltipHelpers;
