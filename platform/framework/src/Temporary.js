/**
 * Created by vwoeltje on 10/30/14.
 */


/*global define*/

define(
    [],
    function () {
        "use strict";

        function Temporary() {
            return {
                someMethod: function () {
                    return "returnValue";
                }
            };
        }

        return Temporary;
    }
);