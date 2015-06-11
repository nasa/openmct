/*global define,jasmine */

define(
    function () {
        "use strict";

        /**
         * MockMoveService provides the same interface as the moveService,
         * returning promises where it would normally do so.  At it's core,
         * it is a jasmine spy object, but it also tracks the promises it
         * returns and provides shortcut methods for resolving those promises
         * synchronously.
         *
         * Usage:
         *
         * ```javascript
         * var moveService = new MockMoveService();
         *
         * // validate is a standard jasmine spy.
         * moveService.validate.andReturn(true);
         * var isValid = moveService.validate(object, parentCandidate);
         * expect(isValid).toBe(true);
         *
         * // perform returns promises and tracks them.
         * var whenCopied = jasmine.createSpy('whenCopied');
         * moveService.perform(object, parentObject).then(whenCopied);
         * expect(whenCopied).not.toHaveBeenCalled();
         * moveService.perform.mostRecentCall.resolve('someArg');
         * expect(whenCopied).toHaveBeenCalledWith('someArg');
         * ```
         */
        function MockMoveService() {
            // track most recent call of a function,
            // perform automatically returns
            var mockMoveService = jasmine.createSpyObj(
                'MockMoveService',
                [
                    'validate',
                    'perform'
                ]
            );

            mockMoveService.perform.andCallFake(function () {
                var performPromise,
                    callExtensions,
                    spy;

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

            return mockMoveService;
        }

        return MockMoveService;
    }
);
