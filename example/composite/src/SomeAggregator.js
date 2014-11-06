/*global define,Promise*/

/**
 * Module defining SomeAggregator. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeAggregator(someProviders) {
            return {
                getMessages: function () {
                    return someProviders.map(function (provider) {
                        return provider.getMessages();
                    }).reduce(function (a, b) {
                        return a.concat(b);
                    }, []);
                }
            };
        }

        return SomeAggregator;
    }
);