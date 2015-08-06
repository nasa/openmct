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

/*global define */

define(
    function () {
        "use strict";
        /**
         * MoveService provides an interface for moving objects from one
         * location to another.  It also provides a method for determining if
         * an object can be copied to a specific location.
         */
        function MoveService(policyService, linkService, $q) {


            /**
             * Returns a promise for a childSelector for a given object which
             * returns all original children in that given object.
             */
            function getOriginalsInObject(object) {
                var originalChildren = {};
                return getOriginalChildren(object)
                    .then(function recurseChildren(children) {
                        var promises = [];
                        children.children.forEach(function(child) {
                            promises.push(getOriginalsInObject(child));
                            originalChildren[child.getId()] = {};
                        });
                        return $q.all(promises);
                    }).then(function prepareResponse(childResponses) {
                        childResponses.forEach(function(childResp) {
                            Object.keys(childResp).forEach(function(childId) {
                                originalChildren[childId] = childResp[childId];
                            });
                        });
                        var childSelector = {};
                        childSelector[object.getId()] = originalChildren;
                        return childSelector;
                    });
            }

            /**
             * Get the original children in an object.  Returns a promise for an object
             * with a single key (the object's key), the value of which is an array
             * of original children in that object.
             */
            function getOriginalChildren(object) {
                if (!object.hasCapability('composition')) {
                    return $q.when({
                            objectId: object.getId(),
                            children: []
                    });
                }
                return object.useCapability('composition')
                    .then(function filterToOriginal(children) {
                        return children.filter(function(child) {
                            if (child.hasCapability('location')) {
                                return child.getCapability('location')
                                    .isOriginal();
                            }
                            return false;
                        });
                    })
                    .then(function returnAsObject(children) {
                        return {
                            objectId: object.getId(),
                            children: children
                        };
                    });
            }

            /**
             * Persist an instance of an object as the original location of
             * that object.
             */
            function saveAsOriginal(newOriginal) {
                return newOriginal.useCapability(
                    'mutation',
                    function (model) {
                        model.location = newOriginal
                            .getCapability('location')
                            .getLocation();
                    }
                ).then(function() {
                    return newOriginal
                        .getCapability('persistence')
                        .persist();
                });
            }

            /**
             * childrenSelector is an object where keys are childIds and values
             * are childSelector objects.  Returns all children in the object
             * which have a key in the childSelector, plus all children from
             * recursive childSelection.
             */
            function getMatchingChildrenFromObject(object, childrenSelector) {
                var selected = [];
                if (!object.hasCapability('composition')) {
                    return $q.when(selected);
                }
                return object.useCapability('composition')
                    .then(function selectChildren(children) {
                        var promises = [];
                        children.forEach(function (child) {
                            if (!childrenSelector[child.getId()]) {
                                return;
                            }
                            selected.push(child);
                            promises.push(getMatchingChildrenFromObject(
                                child,
                                childrenSelector[child.getId()]
                            ));
                        });

                        return $q.all(promises)
                            .then(function reduceResults (results) {
                                return results.reduce(function(memo, result) {
                                    return memo.concat(result);
                                }, selected);
                            });
                    });
            }


            /**
             * Uses the original object to determine which objects are originals,
             * and then returns a function which, when given the same object in the
             * new context, will update the location of all originals in the leaf
             * to match the new context.
             */
            function updateOriginalLocation(object) {
                var oldLocationCapability = object.getCapability('location');
                if (!oldLocationCapability.isOriginal()) {
                    return function (objectInNewContext) {
                        return objectInNewContext;
                    };
                }
                return function setOriginalLocation(objectInNewContext) {
                    return saveAsOriginal(objectInNewContext)
                        .then(function () {
                            if (!object.hasCapability('composition')) {
                                return objectInNewContext;
                            }
                            getOriginalsInObject(object)
                                .then(function(childSelector) {
                                    return getMatchingChildrenFromObject(
                                        objectInNewContext,
                                        childSelector[object.getId()]
                                    );
                                }).then(function(originalChildren) {
                                    return $q.all(
                                        originalChildren.map(saveAsOriginal)
                                    );
                                }).then(function() {
                                    return objectInNewContext;
                                });
                        });
                };
            }

            return {
                /**
                 * Returns `true` if `object` can be moved into
                 * `parentCandidate`'s composition.
                 */
                validate: function (object, parentCandidate) {
                    var currentParent = object
                        .getCapability('context')
                        .getParent();

                    if (!parentCandidate || !parentCandidate.getId) {
                        return false;
                    }
                    if (parentCandidate.getId() === currentParent.getId()) {
                        return false;
                    }
                    if (parentCandidate.getId() === object.getId()) {
                        return false;
                    }
                    if (parentCandidate.getModel().composition.indexOf(object.getId()) !== -1) {
                        return false;
                    }
                    return policyService.allow(
                        "composition",
                        parentCandidate.getCapability('type'),
                        object.getCapability('type')
                    );
                },
                /**
                 * Move `object` into `parentObject`'s composition.
                 *
                 * @returns {Promise} A promise that is fulfilled when the
                 *    move operation has completed.
                 */
                perform: function (object, parentObject) {
                    return linkService
                        .perform(object, parentObject)
                        .then(updateOriginalLocation(object))
                        .then(function () {
                            return object
                                .getCapability('action')
                                .perform('remove');
                        });
                }
            };
        }

        return MoveService;
    }
);
