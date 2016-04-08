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

define([], function () {
    "use strict";

    /**
     * Policy suppressing links when the linked-to domain object is in
     * edit mode. Domain objects being edited may not have been persisted,
     * so creating links to these can result in inconsistent state.
     *
     * @memberof platform/commonUI/edit
     * @constructor
     * @implements {Policy.<View, DomainObject>}
     */
    function EditableLinkPolicy() {
    }

    EditableLinkPolicy.prototype.allow = function (action, context) {
        var key = action.getMetadata().key;

        if (key === 'link') {
            return !((context.selectedObject || context.domainObject)
                .hasCapability('editor'));
        }

        // Like all policies, allow by default.
        return true;
    };

    return EditableLinkPolicy;
});
