/*global define,Promise*/

/**
 * Module defining DropGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {
        "use strict";

        /**
         * A DropGesture adds and maintains event handlers upon an element
         * such that it may act as a drop target for drag-drop composition.

         * @constructor
         * @param $q Angular's $q, for promise handling
         * @param element the jqLite-wrapped representation element
         * @param {DomainObject} domainObject the domain object whose
         *        composition should be modified as a result of the drop.
         */

        function DropGesture($q, element, domainObject) {

            function doPersist() {
                var persistence = domainObject.getCapability("persistence");
                return $q.when(persistence && persistence.persist());
            }

            function dragOver(e) {
                var event = (e || {}).originalEvent || e;

                // TODO: Vary this based on modifier keys
                event.dataTransfer.dropEffect = 'move';

                // Indicate that we will accept the drag
                event.preventDefault(); // Required in Chrome?
                return false;
            }

            function drop(e) {
                var event = (e || {}).originalEvent || e,
                    id = event.dataTransfer.getData(GestureConstants.MCT_DRAG_TYPE);

                // Handle the drop; add the dropped identifier to the
                // destination domain object's composition, and persist
                // the change.
                if (id) {
                    $q.when(domainObject.useCapability(
                        'mutation',
                        function (model) {
                            var composition = model.composition;
                            // Don't store the same id more than once
                            if (composition && // not-contains
                                    !(composition.map(function (i) {
                                        return i === id;
                                    }).reduce(function (a, b) {
                                        return a || b;
                                    }, false))) {
                                model.composition.push(id);
                            }
                        }
                    )).then(function (result) {
                        // If mutation was successful, persist the change
                        return result && doPersist();
                    });
                }

            }

            // Listen for dragover,  to indicate we'll accept a drag
            element.on('dragover', dragOver);

            // Listen for the drop itself
            element.on('drop', drop);

            return {
                /**
                 * Detach any event handlers associated with this gesture.
                 */
                destroy: function () {
                    element.off('dragover', dragOver);
                    element.off('drop', drop);
                }
            };

        }


        return DropGesture;
    }
);