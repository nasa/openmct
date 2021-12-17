/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

/**
 * Module defining ViewProvider. Created by vwoeltje on 11/10/14.
 */
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

/**
 * Module defining ViewProvider. Created by vwoeltje on 11/10/14.
 */
function ViewProvider(views, $log) {

    // Views without defined keys cannot be used in the user
    // interface, and can result in unexpected behavior. These
    // are filtered out using this function.
    function validate(view) {
        var key = view.key;

        // Leave a log message to support detection of this issue.
        if (!key) {
            $log.warn([
                "No key specified for view in ",
                (view.bundle || {}).path,
                "; omitting this view."
            ].join(""));
        }

        return key;
    }

    // Filter out any key-less views
    this.views = views.filter(validate);
}

ViewProvider.prototype.getViews = function (domainObject) {
    var type = domainObject.useCapability("type");

    // Check if an object has all capabilities designated as `needs`
    // for a view. Exposing a capability via delegation is taken to
    // satisfy this filter if `allowDelegation` is true.
    function capabilitiesMatch(domainObj, capabilities, allowDelegation) {
        var delegation = domainObj.getCapability("delegation");

        allowDelegation = allowDelegation && (delegation !== undefined);

        // Check if an object has (or delegates, if allowed) a
        // capability.
        function hasCapability(c) {
            return domainObj.hasCapability(c)
                || (allowDelegation && delegation.doesDelegateCapability(c));
        }

        // For the reduce step below.
        function and(a, b) {
            return a && b;
        }

        // Do a bulk `and` operation over all needed capabilities.
        return capabilities.map(hasCapability).reduce(and, true);
    }

    // Check if a view and domain object type can be paired;
    // both can restrict the others they accept.
    function viewMatchesType(view, objType) {
        var views = objType && (objType.getDefinition() || {}).views,
            matches = true;

        // View is restricted to a certain type
        if (view.type) {
            matches = matches && objType && objType.instanceOf(view.type);
        }

        // Type wishes to restrict its specific views
        if (Array.isArray(views)) {
            matches = matches && (views.indexOf(view.key) > -1);
        }

        return matches;
    }

    // First, filter views by type (matched to domain object type.)
    // Second, filter by matching capabilities.
    return this.views.filter(function (view) {
        return viewMatchesType(view, type) && capabilitiesMatch(
            domainObject,
            view.needs || [],
            view.delegation || false
        );
    });
};

export default ViewProvider;