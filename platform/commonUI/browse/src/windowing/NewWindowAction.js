/*global define,Promise*/

/**
 * Module defining NewWindowAction. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The new window action allows a domain object to be opened
         * into a new browser window. (Currently this is a stub, present
         * to allow the control to appear in the appropriate location in
         * the user interface.)
         * @constructor
         */
        function NewWindowAction($window) {
            return {
                /**
                 * Open the object in a new window (currently a stub)
                 */
                perform: function () {
                    $window.alert("Not yet functional. This will open objects in a new window.");
                }
            };
        }

        return NewWindowAction;
    }
);