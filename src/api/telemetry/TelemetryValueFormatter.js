/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    'lodash'
], (_) => {

    // TODO: needs reference to formatService;
    class TelemetryValueFormatter {
      constructor(valueMetadata, formatService) {
        this.valueMetadata = valueMetadata;
        this.parseCache = new WeakMap();
        this.formatCache = new WeakMap();
        try {
            this.formatter = formatService
                .getFormat(valueMetadata.format, valueMetadata);
        } catch (e) {
            // TODO: Better formatting
            this.formatter = {
                parse: (x) => {
                    return Number(x);
                },
                format: (x) => {
                    return x;
                },
                validate: (x) => {
                    return true;
                }
            };
        }

        if (valueMetadata.type === 'enum') {
            this.formatter = {};
            this.enumerations = valueMetadata.enumerations.reduce( (vm, e) => {
                vm.byValue[e.value] = e.string;
                vm.byString[e.string] = e.value;
                return vm;
            }, {byValue: {}, byString: {}});
            this.formatter.format = (value) => {
                return this.enumerations.byValue[value];
            };
            this.formatter.parse = (string) => {
                if (typeof string === "string" && this.enumerations.hasOwnProperty(string)) {
                    return this.enumerations.byString[string];
                }
                return Number(string);
            };
        }
    }

    parse(datum) {
        if (_.isObject(datum)) {
            if (!this.parseCache.has(datum)) {
                this.parseCache.set(
                    datum,
                    this.formatter.parse(datum[this.valueMetadata.source])
                );
            }
            return this.parseCache.get(datum);
        }
        return this.formatter.parse(datum);
    }

    format(datum) {
        if (_.isObject(datum)) {
            if (!this.formatCache.has(datum)) {
                this.formatCache.set(
                    datum,
                    this.formatter.format(datum[this.valueMetadata.source])
                );
            }
            return this.formatCache.get(datum);
        }
        return this.formatter.format(datum);
    }
}
return TelemetryValueFormatter;
});
