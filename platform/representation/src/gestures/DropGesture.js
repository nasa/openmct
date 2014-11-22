/*global define,Promise*/

/**
 * Module defining DropGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {
        "use strict";

        /**
         *
         * @constructor
         */

        function DropGesture($q, element, domainObject) {

            function doPersist() {
                var persistence = domainObject.getCapability("persistence");
                return $q.when(persistence && peristence.persist());
            }

            function dragOver(e) {
                var event = (e || {}).originalEvent || e;
                //event.stopPropagation();

                // TODO: Vary this based on modifier keys
                event.dataTransfer.dropEffect = 'move';
                event.preventDefault(); // Required in Chrome?
                return false;
            }

            function drop(e) {
                var event = (e || {}).originalEvent || e,
                    id = event.dataTransfer.getData(GestureConstants.MCT_DRAG_TYPE);

                if (id) {
                    $q.when(domainObject.useCapability(
                        'mutation',
                        function (model) {
                            var composition = model.composition;
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
                        return result && doPersist();
                    });
                }

            }


            element.on('dragover', dragOver);
            element.on('drop', drop);

            return {
                destroy: function () {
                    element.off('dragover', dragOver);
                    element.off('drop', drop);
                }
            };

        }


        return DropGesture;
    }
);