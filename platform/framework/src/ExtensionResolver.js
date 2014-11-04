/*global define,Promise*/

/**
 * Module defining ExtensionResolver. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * An ExtensionResolver is responsible for loading any implementation
         * modules associated with specific extensions.
         *
         * @param {ImplementationLoader} loader used to load implementations
         * @param {*} $log Angular's logging service
         * @constructor
         */
        function ExtensionResolver(loader, $log) {
            function loadImplementation(extension) {
                var implPath = extension.getImplementationPath(),
                    implPromise = loader.load(implPath),
                    definition = extension.getDefinition();

                // Attach values from the object definition to the
                // loaded implementation.
                function attachDefinition(impl) {
                    var result = (typeof impl === 'function') ?
                            function () {
                                return impl.apply({}, arguments);
                            } :
                            Object.create(impl);

                    Object.keys(definition).forEach(function (k) {
                        result[k] = definition[k];
                    });

                    // Log that this load was successful
                    $log.info("Loaded " + extension.getLogName());

                    return result;
                }

                // Log any errors in loading the implementation, and
                // return the plain extension definition instead.
                function handleError(err) {
                    // Build up a log message from parts
                    var message = [
                            "Could not load implementation for extension ",
                            extension.getLogName(),
                            " due to ",
                            err.message
                        ].join("");

                    // Log that the extension was not loaded
                    $log.warn(message);

                    return extension.getDefinition();
                }

                // Log that loading has begun
                $log.info([
                    "Loading implementation ",
                    implPath,
                    " for extension ",
                    extension.getLogName()
                ].join(""));

                return implPromise.then(attachDefinition, handleError);
            }

            return {
                /**
                 * Resolve the provided extension; this will give a promise
                 * for the extension's implementation, if one has been
                 * specified, or for the plain definition of the extension
                 * otherwise. The plain definition will also be given
                 * if the implementation fails to load for some reason.
                 *
                 * All key-value pairs from the extension definition
                 * will additionally be attached to any loaded implementation.
                 *
                 * @param {Extension} extension
                 */
                resolve: function (extension) {
                    // Log that loading has begun
                    $log.info([
                        "Resolving extension ",
                        extension.getLogName()
                    ].join(""));

                    return extension.hasImplementation() ?
                            loadImplementation(extension) :
                            Promise.resolve(extension.getDefinition());
                }
            };
        }

        return ExtensionResolver;
    }
);