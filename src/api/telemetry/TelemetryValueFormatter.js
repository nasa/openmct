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

import _ from 'lodash';
import { sprintf } from 'printj';

// TODO: needs reference to formatService;
export default class TelemetryValueFormatter {
  constructor(valueMetadata, formatMap) {
    this.valueMetadata = valueMetadata;
    this.formatMap = formatMap;
    this.valueMetadataFormat = this.getNonArrayValue(valueMetadata.format);

    const numberFormatter = {
      parse: (x) => Number(x),
      format: (x) => x,
      validate: (x) => true
    };

    // Is there an existing formatter for the format specified? If not, default to number format
    this.formatter = formatMap.get(this.valueMetadataFormat) || numberFormatter;
    if (this.valueMetadataFormat === 'enum') {
      this.formatter = {};
      this.enumerations = valueMetadata.enumerations.reduce(
        function (vm, e) {
          vm.byValue[e.value] = e.string;
          vm.byString[e.string] = e.value;

          return vm;
        },
        {
          byValue: {},
          byString: {}
        }
      );
      this.formatter.format = (value) => {
        if (Object.prototype.hasOwnProperty.call(this.enumerations.byValue, value)) {
          return this.enumerations.byValue[value];
        }

        return value;
      };
      this.formatter.parse = (string) => {
        if (typeof string === 'string') {
          if (Object.prototype.hasOwnProperty.call(this.enumerations.byString, string)) {
            return this.enumerations.byString[string];
          }
        }

        return Number(string);
      };
    }

    // Check for formatString support once instead of per format call.
    if (valueMetadata.formatString) {
      const baseFormat = this.formatter.format;
      const formatString = this.getNonArrayValue(valueMetadata.formatString);
      this.formatter.format = function (value) {
        return sprintf(formatString, baseFormat.call(this, value));
      };
    }

    if (this.valueMetadataFormat === 'string') {
      this.formatter.parse = function (value) {
        if (value === undefined) {
          return '';
        }

        if (typeof value === 'string') {
          return value;
        } else {
          return value.toString();
        }
      };

      this.formatter.format = function (value) {
        return value;
      };

      this.formatter.validate = function (value) {
        return typeof value === 'string';
      };
    }
  }

  getNonArrayValue(value) {
    //metadata format could have array formats ex. string[]/number[]
    const arrayRegex = /\[\]$/g;
    if (value && value.match(arrayRegex)) {
      return value.replace(arrayRegex, '');
    }

    return value;
  }

  parse(datum) {
    const isDatumArray = Array.isArray(datum);
    if (_.isObject(datum)) {
      const objectDatum = isDatumArray ? datum : datum[this.valueMetadata.source];
      if (Array.isArray(objectDatum)) {
        return objectDatum.map((item) => {
          return this.formatter.parse(item);
        });
      } else {
        return this.formatter.parse(objectDatum);
      }
    }

    return this.formatter.parse(datum);
  }

  format(datum) {
    const isDatumArray = Array.isArray(datum);
    if (_.isObject(datum)) {
      const objectDatum = isDatumArray ? datum : datum[this.valueMetadata.source];
      if (Array.isArray(objectDatum)) {
        return objectDatum.map((item) => {
          return this.formatter.format(item);
        });
      } else {
        return this.formatter.format(objectDatum);
      }
    }

    return this.formatter.format(datum);
  }
}
