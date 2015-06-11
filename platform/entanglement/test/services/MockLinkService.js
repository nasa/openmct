/*global define,jasmine */

define(
    function () {
        "use strict";

        /**
         * MockLinkService provides the same interface as the linkService,
         * returning promises where it would normally do so.  At it's core,
         * it is a jasmine spy object, but it also tracks the promises it
         * returns and provides shortcut methods for resolving those promises
         * synchronously.
         *
         * Usage:
         *
         * ```javascript
         * var linkService = new MockLinkService();
         *
         * // validate is a standard jasmine spy.
         * linkService.validate.andReturn(true);
         * var isValid = linkService.validate(object, parentObject);
         * expect(isValid).toBe(true);
         *
         * // perform returns promises and tracks them.
         * var whenLinked = jasmine.createSpy('whenLinked');
         * linkService.perform(object, parentObject).then(whenLinked);
         * expect(whenLinked).not.toHaveBeenCalled();
         * linkService.perform.mostRecentCall.resolve('someArg');
         * expect(whenLinked).toHaveBeenCalledWith('someArg');
         * ```
         */
        function MockLinkService() {
            // track most recent call of a function,
            // perform automatically returns
            var mockLinkService = jasmine.createSpyObj(
                'MockLinkService',
                [
                    'validate',
                    'perform'
                ]
            );

            mockLinkService.perform.andCallFake(function () {
                var performPromise,
                    callExtensions,
                    spy;

                // TODO: return a proper deferred to support composing.
                performPromise = jasmine.createSpyObj(
                    'performPromise',
                    ['then']
                );

                callExtensions = {
                    promise: performPromise,
                    resolve: function (resolveWith) {
                        performPromise.then.calls.forEach(function (call) {
                            call.args[0](resolveWith);
                        });
                    }
                };

                spy = this.perform;

                Object.keys(callExtensions).forEach(function (key) {
                    spy.mostRecentCall[key] = callExtensions[key];
                    spy.calls[spy.calls.length - 1][key] = callExtensions[key];
                });

                return performPromise;
            });

            return mockLinkService;
        }

        return MockLinkService;
    }
);
