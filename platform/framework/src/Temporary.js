/*global define*/

/**
 * This is a temporary file. It is present to verify
 * that build, including test scripts, can be executed.
 */
define(
    [],
    function () {
        "use strict";

        function Temporary() {
            return {
                someMethod: function () {
                    return "Hello, world.";
                }
            };
        }

        return Temporary;
    }
);