define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeProvider() {
            return {
                getMessages: function () {
                    return [
                        "I am a message from some provider."
                    ];
                }
            };
        }

        return SomeProvider;
    }
);