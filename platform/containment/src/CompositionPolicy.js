/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

/**
 * This bundle implements "containment" rules, which determine which objects
 * can be contained within which other objects.
 * @namespace platform/containment
 */
define(
    ['./ContainmentTable'],
    function (ContainmentTable) {
        "use strict";

        /**
         * Defines composition policy as driven by type metadata.
         * @constructor
         * @memberof platform/containment
         * @implements {Policy.<Type, Type>}
         */
        function CompositionPolicy($injector) {
            // We're really just wrapping the containment table and rephrasing
            // it as a policy decision.
            var table;

            this.getTable = function () {
                return (table = table || new ContainmentTable(
                    $injector.get('typeService'),
                    $injector.get('capabilityService')
                ));
            };
        }

        CompositionPolicy.prototype.allow = function (candidate, context) {
            return this.getTable().canContain(candidate, context);
        };

        return CompositionPolicy;
    }
);
