/*global define,Promise*/

/**
 * Module defining CustomRegistrars. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Handles registration of a few specific extension types that are
         * understood natively by Angular. This includes services and
         * directives.
         * @constructor
         */
        function CustomRegistrars(app, $log) {
            function CustomRegistrar(angularFunction) {
                function registerExtension(extension, index) {
                    var key = extension.key,
                        dependencies = extension.depends || [];

                    if (!key) {
                        $log.warn([
                            "Cannot register ",
                            angularFunction,
                            ", ",
                            index,
                            "no key specified. ",
                            JSON.stringify(extension)
                        ].join(""));
                    } else {
                        $log.info([
                            "Registering ",
                            angularFunction,
                            ": ",
                            key
                        ]);
                        app[angularFunction](
                            key,
                            dependencies.concat([extension])
                        );
                    }
                }
            }

            return {
                services: registerExtension;
            };
        }

        return CustomRegistrars;
    }
);