/*global define,Promise*/

/**
 * Module defining PartialConstructor. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A partial constructor is used to instantiate objects in two
         * stages:
         *
         * * First, dependencies injected from Angular
         * * Second, arguments passed at run-time
         *
         * This allows extensions to accept both their Angular-injected
         * dependencies and their per-instance attributes all in one
         * constructor invocation. User code for these extensions then
         * does not see the Angular dependency arguments; they may
         * instantiate instances of these extensions by passing only
         * those per-instance arguments.
         *
         * @constructor
         */
        function PartialConstructor(Constructor) {

            return function () { // Bind services
                var dependencies = Array.prototype.slice.call(arguments);

                return function () { // Bind everything else
                    var other = Array.prototype.slice.call(arguments),
                        instance = Object.create(Constructor.prototype);

                    // Mimic "new" behavior with apply.
                    instance = Constructor.apply(
                        instance,
                        dependencies.concat(other)
                    ) || instance;

                    return instance;
                };
            };
        }

        return PartialConstructor;
    }
);