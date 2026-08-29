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
import { sprintf } from 'printj';

export default class CustomStringFormatter {
  constructor(openmct, valueMetadata, itemFormat) {
    this.openmct = openmct;

    this.itemFormat = itemFormat;
    this.valueMetadata = valueMetadata;
  }

  format(datum) {
    if (!this.itemFormat) {
      return;
    }

    if (!this.itemFormat.startsWith('&')) {
      return sprintf(this.itemFormat, datum[this.valueMetadata.key]);
    }

    try {
      const key = this.itemFormat.slice(1);
      const customFormatter = this.openmct.telemetry.getFormatter(key);
      if (!customFormatter) {
        throw new Error('Custom Formatter not found');
      }

      return customFormatter.format(datum[this.valueMetadata.key]);
    } catch (e) {
      console.error(e);

      return datum[this.valueMetadata.key];
    }
  }

  setFormat(itemFormat) {
    this.itemFormat = itemFormat;
  }
}
