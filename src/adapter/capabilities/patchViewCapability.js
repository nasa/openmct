/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
], function (
    _
) {

    function patchViewCapability(viewConstructor) {
        return function makeCapability(domainObject) {
            const capability = viewConstructor(domainObject);
            const oldInvoke = capability.invoke.bind(capability);

            /* eslint-disable you-dont-need-lodash-underscore/map */
            capability.invoke = function () {
                const availableViews = oldInvoke();
                const newDomainObject = capability
                    .domainObject
                    .useCapability('adapter');

                return _(availableViews).map(function (v, i) {
                    const vd = {
                        view: v,
                        priority: i + 100 // arbitrary to allow new views to
                        // be defaults by returning priority less than 100.
                    };
                    if (v.provider && v.provider.priority) {
                        vd.priority = v.provider.priority(newDomainObject);
                    }

                    return vd;
                })
                    .sortBy('priority')
                    .map('view')
                    .value();
            };
            /* eslint-enable you-dont-need-lodash-underscore/map */

            return capability;
        };
    }

    return patchViewCapability;
});
