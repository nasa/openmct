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
 * Module defining RemoveAction. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Construct an action which will remove the provided object manifestation.
         * The object will be removed from its parent's composition; the parent
         * is looked up via the "context" capability (so this will be the
         * immediate ancestor by which this specific object was reached.)
         *
         * @param {DomainObject} object the object to be removed
         * @param {ActionContext} context the context in which this action is performed
         * @memberof platform/commonUI/edit
         * @constructor
         * @implements {Action}
         */
        function RemoveAction($q, navigationService, context) {
            this.domainObject = (context || {}).domainObject;
            this.$q = $q;
            this.navigationService = navigationService;
        }

        /**
         * Perform this action.
         * @return {Promise} a promise which will be
         *         fulfilled when the action has completed.
         */
        RemoveAction.prototype.perform = function () {
            var $q = this.$q,
                navigationService = this.navigationService,
                domainObject = this.domainObject;
            /*
             * Check whether an object ID matches the ID of the object being
             * removed (used to filter a parent's composition to handle the
             * removal.)
             */
            function isNotObject(otherObjectId) {
                return otherObjectId !== domainObject.getId();
            }

            /*
             * Mutate a parent object such that it no longer contains the object
             * which is being removed.
             */
            function doMutate(model) {
                model.composition = model.composition.filter(isNotObject);
            }

            /*
             * Invoke persistence on a domain object. This will be called upon
             * the removed object's parent (as its composition will have changed.)
             */
            function doPersist(domainObject) {
                var persistence = domainObject.getCapability('persistence');
                return persistence && persistence.persist();
            }

            /*
             * Checks current object and ascendants of current
             * object with object being removed, if the current
             * object or any in the current object's path is being removed,
             * navigate back to parent of removed object.
             */
            function checkObjectNavigation(object, parentObject) {
                // Traverse object starts at current location
                var traverseObject = (navigationService).getNavigation(),
                    context;

                // Stop when object is not defined (above ROOT)
                while (traverseObject) {
                    // If object currently traversed to is object being removed
                    // navigate to parent of current object and then exit loop
                    if (traverseObject.getId() === object.getId()) {
                        navigationService.setNavigation(parentObject);
                        return;
                    }
                    // Traverses to parent of current object, moving
                    // up the ascendant path
                    context = traverseObject.getCapability('context');
                    traverseObject = context && context.getParent();
                }
            }

            /*
             * Remove the object from its parent, as identified by its context
             * capability. Based on object's location and selected object's location
             * user may be navigated to existing parent object
             */
            function removeFromContext(object) {
                var contextCapability = object.getCapability('context'),
                    parent = contextCapability.getParent();

                // If currently within path of removed object(s),
                // navigates to existing object up tree
                checkObjectNavigation(object, parent);

                return $q.when(
                    parent.useCapability('mutation', doMutate)
                ).then(function () {
                    return doPersist(parent);
                });
            }

            return $q.when(domainObject)
                .then(removeFromContext);
        };

        // Object needs to have a parent for Remove to be applicable
        RemoveAction.appliesTo = function (context) {
            var object = (context || {}).domainObject,
                contextCapability = object && object.getCapability("context"),
                parent = contextCapability && contextCapability.getParent(),
                parentType = parent && parent.getCapability('type'),
                parentCreatable = parentType && parentType.hasFeature('creation');

            // Only creatable types should be modifiable
            return parent !== undefined &&
                    Array.isArray(parent.getModel().composition) &&
                    parentCreatable;
        };

        return RemoveAction;
    }
);
