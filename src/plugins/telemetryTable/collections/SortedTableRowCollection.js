/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define(
    [
        'lodash',
        'EventEmitter'
    ],
    function (
        _,
        EventEmitter
    ) {

        /**
         * @constructor
         */
        class SortedTableRowCollection extends EventEmitter {
            constructor () {
                super();

                this.dupeCheck = false;
                this.rows = [];
            }

            addOne(item) {
                if (this.sortOptions === undefined) {
                    throw 'Please specify sort options';
                }

                let isDuplicate = false;

                // Going to check for duplicates. Bound the search problem to
                // items around the given time. Use sortedIndex because it
                // employs a binary search which is O(log n). Can use binary search
                // based on time stamp because the array is guaranteed ordered due
                // to sorted insertion.
                let startIx = _.sortedIndex(this.rows, item, 'datum.' + this.sortOptions.key);
                let endIx = undefined;

                if (this.dupeCheck && startIx !== array.length) {
                    endIx = _.sortedLastIndex(this.rows, item, 'datum.' + this.sortOptions.key);

                    // Create an array of potential dupes, based on having the
                    // same time stamp
                    let potentialDupes = this.rows.slice(startIx, endIx + 1);
                    // Search potential dupes for exact dupe
                    isDuplicate = _.findIndex(potentialDupes, _.isEqual.bind(undefined, item)) > -1;
                }

                if (!isDuplicate) {
                    this.rows.splice(endIx || startIx, 0, item);
                    return true;
                }
                return false;
            }

            /**
             * Add an array of objects to this telemetry collection
             * @fires TelemetryCollection#added
             * @param {object[]} items
             */
            add(items) {
                var added = items.filter(this.addOne, this);
                this.emit('add', added);
                this.dupeCheck = true;
            }

            /**
             * Sorts the telemetry collection based on the provided sort field
             * specifier. Subsequent inserts are sorted to maintain specified sport
             * order.
             *
             * @example
             * // First build some mock telemetry for the purpose of an example
             * let now = Date.now();
             * let telemetry = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (value) {
             *     return {
             *         // define an object property to demonstrate nested paths
             *         timestamp: {
             *             ms: now - value * 1000,
             *             text:
             *         },
             *         value: value
             *     }
             * });
             * let collection = new TelemetryCollection();
             *
             * collection.add(telemetry);
             *
             * // Sort by telemetry value
             * collection.sortBy({
             *  key: 'value', direction: 'asc'
             * });
             *
             * // Sort by ms since epoch
             * collection.sort({
             *  key: 'timestamp.ms',
             *  direction: 'asc'
             * });
             *
             * // Sort by 'text' attribute, descending
             * collection.sort("timestamp.text");
             *
             *
             * @param {object} sortOptions An object specifying a sort key, and direction.
             */
            sortBy(sortOptions) {
                if (arguments.length > 0) {
                    this.sortOptions = sortOptions;
                    this.rows = _.sortByOrder(this.rows, 'datum.' + sortOptions.key, sortOptions.direction);
                    this.emit('sort');
                }

                return this.sortOptions; 
            }

            getRows () {
                return this.rows;
            }
        }
    return SortedTableRowCollection;
});
