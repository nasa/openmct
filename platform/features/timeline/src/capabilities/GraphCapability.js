/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    ['./ResourceGraph', './CumulativeGraph'],
    (ResourceGraph, CumulativeGraph) => {

        /**
         * Implements the `graph` capability for Timeline and
         * Activity objects.
         *
         * @constructor
         * @param {DomainObject} domainObject the Timeline or Activity
         */
        const GraphCapability = ($q, domainObject) => {


            // Build graphs for this group of utilizations
            const buildGraphs = (utilizations) => {
                let utilizationMap = {},
                    result = {},
                    startingSOC;

                // Bucket utilizations by type
                utilizations.forEach( (u) => {
                    let k = u.key;
                    utilizationMap[k] = utilizationMap[k] || [];
                    utilizationMap[k].push(u);
                });

                // ...then convert to graphs
                Object.keys(utilizationMap).forEach( (k) => {
                    result[k] = new ResourceGraph(utilizationMap[k]);
                });

                // Add battery state of charge
                if (domainObject.getModel().type === 'timeline' &&
                        result.power &&
                            domainObject.getModel().capacity > 0) {
                    startingSOC = isNaN(parseFloat(domainObject.getModel().startingSOC)) ?
                                    100 : parseFloat(domainObject.getModel().startingSOC);

                    result.battery = new CumulativeGraph(
                        result.power,
                        0,
                        domainObject.getModel().capacity, // Watts
                        (startingSOC / 100) * domainObject.getModel().capacity,
                        1 / 3600000 // millis-to-hour (since units are watt-hours)
                    );
                }

                return result;
            }

            return {
                /**
                 * Get resource graphs associated with this object.
                 * This is given as a promise for key-value pairs,
                 * where keys are resource types and values are graph
                 * objects.
                 * @returns {Promise} a promise for resource graphs
                 */
                invoke: () => {
                    return $q.when(
                        domainObject.useCapability('utilization') || []
                    ).then(buildGraphs);
                }
            };
        }

        // Only applies to timeline objects
        GraphCapability.appliesTo = (model) => {
            return model &&
                ((model.type === 'timeline') ||
                        (model.type === 'activity'));
        };

        return GraphCapability;

    }
);
