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
    [],
    () => {

        /**
         * Handles drop (from drag-and-drop) initiated changes to a swimlane.
         * @constructor
         */
        const TimelineSwimlaneDropHandler = (swimlane) => {
            // Check if we are in edit mode (also check parents)
            const inEditMode = () => {
                return swimlane.domainObject.hasCapability('editor') &&
                    swimlane.domainObject.getCapability('editor').inEditContext();
            }

            // Boolean and (for reduce below)
            const or = (a, b) => {
                return a || b;
            }

            // Check if pathA entirely contains pathB
            const pathContains = (swimlaneToCheck, id) => {
                // Check if id at a specific index matches (for map below)
                const matches = (pathId) => {
                    return pathId === id;
                }

                // Path A contains Path B if it is longer, and all of
                // B's ids match the ids in A.
                return swimlaneToCheck.idPath.map(matches).reduce(or, false);
            }

            // Check if a swimlane contains a child with the specified id
            const contains = (swimlaneToCheck, id) => {
                // Check if a child swimlane has a matching domain object id
                const matches = (child) => {
                    return child.domainObject.getId() === id;
                }

                // Find any one child id that matches this id
                return swimlaneToCheck.children.map(matches).reduce(or, false);
            }

            // Initiate mutation of a domain object
            const doMutate = (domainObject, mutator) => {
                return domainObject.useCapability("mutation", mutator);
            }

            // Check if this swimlane is in a state where a drop-after will
            // act as a drop-into-at-first position (expanded and non-empty)
            const expandedForDropInto =  () => {
                return swimlane.expanded && swimlane.children.length > 0;
            }

            // Check if the swimlane is ready to accept a drop-into
            // (instead of drop-after)
            const isDropInto = () => {
                return swimlane.highlight() || expandedForDropInto();
            }

            const isReorder = (targetObject, droppedObject) => {
                let droppedContext = droppedObject.getCapability('context'),
                    droppedParent =
                        droppedContext && droppedContext.getParent(),
                    droppedParentId = droppedParent && droppedParent.getId();
                return targetObject.getId() === droppedParentId;
            }

            // Choose an appropriate composition action for the drag-and-drop
            const chooseAction = (targetObject, droppedObject) => {
                let actionCapability =
                        targetObject.getCapability('action'),
                    actionKey = droppedObject.hasCapability('editor') ?
                        'move' : 'link';

                return actionCapability && actionCapability.getActions({
                    key: actionKey,
                    selectedObject: droppedObject
                })[0];
            }

            // Choose an index for insertion in a domain object's composition
            const chooseTargetIndex = (id, offset, composition) => {
                return Math.max(
                    Math.min(
                        (composition || []).indexOf(id) + offset,
                        (composition || []).length
                    ),
                    0
                );
            }

            // Insert an id into target's composition
            const insert = (id, target, indexOffset) => {
                let myId = swimlane.domainObject.getId();
                return doMutate(target,  (model) => {
                    model.composition =
                        model.composition.filter( (compId) => {
                            return compId !== id;
                        });
                    model.composition.splice(
                        chooseTargetIndex(myId, indexOffset, model.composition),
                        0,
                        id
                    );
                });
            }

            const canDrop = (targetObject, droppedObject) => {

                return isReorder(targetObject, droppedObject) ||
                        !!chooseAction(targetObject, droppedObject);
            }

            const drop = (domainObject, targetObject, indexOffset) => {
                const changeIndex = () => {
                    let id = domainObject.getId();
                    return insert(id, targetObject, indexOffset);
                }

                return isReorder(targetObject, domainObject) ?
                    changeIndex() :
                    chooseAction(targetObject, domainObject)
                        .perform().then(changeIndex);
            }

            return {
                /**
                 * Check if a drop-into should be allowed for this swimlane,
                 * for the provided domain object identifier.
                 * @param {string} id identifier for the domain object to be
                 *        dropped
                 * @returns {boolean} true if this should be allowed
                 */
                allowDropIn: (id, domainObject) => {
                    return inEditMode() &&
                        !pathContains(swimlane, id) &&
                        !contains(swimlane, id) &&
                        canDrop(swimlane.domainObject, domainObject);
                },
                /**
                 * Check if a drop-after should be allowed for this swimlane,
                 * for the provided domain object identifier.
                 * @param {string} id identifier for the domain object to be
                 *        dropped
                 * @returns {boolean} true if this should be allowed
                 */
                allowDropAfter: (id, domainObject) => {
                    let target = expandedForDropInto() ?
                            swimlane : swimlane.parent;
                    return inEditMode() &&
                        target &&
                        !pathContains(target, id) &&
                        canDrop(target.domainObject, domainObject);
                },
                /**
                 * Drop the provided domain object into a timeline. This is
                 * provided as a mandatory id, and an optional domain object
                 * instance; if the latter is provided, it will be removed
                 * from its parent before being added. (This is specifically
                 * to support moving Activity objects around within a Timeline.)
                 * @param {string} id the identifier for the domain object
                 * @param {DomainObject} [domainObject] the object itself
                 */
                drop: (id, domainObject) => {
                    // Get the desired drop object, and destination index
                    let dropInto = isDropInto(),
                        dropTarget = dropInto ?
                                swimlane.domainObject :
                                swimlane.parent.domainObject,
                        dropIndexOffset = (!dropInto) ? 1 :
                                (swimlane.expanded && swimlane.highlightBottom()) ?
                                        Number.NEGATIVE_INFINITY :
                                        Number.POSITIVE_INFINITY;

                    if (swimlane.highlight() || swimlane.highlightBottom()) {
                        return drop(domainObject, dropTarget, dropIndexOffset);
                    }
                }
            };
        }

        return TimelineSwimlaneDropHandler;
    }
);
