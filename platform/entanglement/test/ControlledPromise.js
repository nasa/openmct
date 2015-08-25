/*global define,spyOn */

define(
    function () {

        /**
         * An instrumented promise implementation for better control of promises
         * during tests.
         *
         */
        function ControlledPromise() {
            this.resolveHandlers = [];
            this.rejectHandlers = [];
            spyOn(this, 'then').andCallThrough();
        }


        /**
         * Resolve the promise, passing the supplied value to all resolve
         * handlers.
         */
        ControlledPromise.prototype.resolve = function(value) {
            this.resolveHandlers.forEach(function(handler) {
                handler(value);
            });
        };

        /**
         * Reject the promise, passing the supplied value to all rejection
         * handlers.
         */
        ControlledPromise.prototype.reject = function(value) {
            this.rejectHandlers.forEach(function(handler) {
                handler(value);
            });
        };

        /**
         * Standard promise.then, returns a promise that support chaining.
         * TODO: Need to support resolve/reject handlers that return promises.
         */
        ControlledPromise.prototype.then = function (onResolve, onReject) {
            var returnPromise = new ControlledPromise();

            if (onResolve) {
                this.resolveHandlers.push(function(resolveWith) {
                    var chainResult = onResolve(resolveWith);
                    if (chainResult && chainResult.then) {
                        // chainResult is a promise, resolve when it resolves.
                        chainResult.then(function(pipedResult) {
                            return returnPromise.resolve(pipedResult);
                        });
                    } else {
                        returnPromise.resolve(chainResult);
                    }
                });
            }

            if (onReject) {
                this.rejectHandlers.push(function(rejectWith) {
                    var chainResult = onReject(rejectWith);
                    if (chainResult && chainResult.then) {
                        chainResult.then(function(pipedResult) {
                            returnPromise.reject(pipedResult);
                        });
                    } else {
                        returnPromise.reject(chainResult);
                    }
                });
            }

            return returnPromise;
        };

        return ControlledPromise;

    }
);
