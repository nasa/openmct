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

define(
    [],
    function () {
        'use strict';

        /**
         * Implements "save" and "cancel" as capabilities of
         * the object. In editing mode, user is seeing/using
         * a copy of the object which is disconnected from persistence; the Save
         * and Cancel actions can use this capability to
         * propagate changes from edit mode to the underlying
         * actual persistable object.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         * @constructor
         * @memberof platform/commonUI/edit
         */
        function EditorCapability(
            transactionService,
            dirtyModelCache,
            domainObject
        ) {
            this.transactionService = transactionService;
            this.dirtyModelCache = dirtyModelCache;
            this.domainObject = domainObject;
        }

        EditorCapability.prototype.edit = function () {
            this.transactionService.startTransaction();
            this.domainObject.getCapability('status').set('editing', true);
        };

        EditorCapability.prototype.save = function () {
            var domainObject = this.domainObject;
            return this.transactionService.commit().then(function() {
                domainObject.getCapability('status').set('editing', false);
            });
        };

        EditorCapability.prototype.invoke = EditorCapability.prototype.edit;

        EditorCapability.prototype.cancel = function () {
            var domainObject = this.domainObject;
            return this.transactionService.cancel().then(function(){
                domainObject.getCapability("status").set("editing", false);
                return domainObject;
            });
        };

        EditorCapability.prototype.dirty = function () {
            return this.dirtyModelCache.isDirty(this.domainObject);
        };

        //TODO: add 'appliesTo'. EditorCapability should not be available
        // for objects that should not be edited

        return EditorCapability;
    }
);
