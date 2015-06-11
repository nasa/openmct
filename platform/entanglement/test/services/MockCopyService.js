/*global define,jasmine */

define(
    function () {
        "use strict";

        /**
         * MockCopyService provides the same interface as the copyService,
         * returning promises where it would normally do so.  At it's core,
         * it is a jasmine spy object, but it also tracks the promises it
         * returns and provides shortcut methods for resolving those promises
         * synchronously.
         *
         * Usage:
         *
         * ```javascript
         * var copyService = new MockCopyService();
         *
         * // validate is a standard jasmine spy.
         * copyService.validate.andReturn(true);
         * var isValid = copyService.validate(object, parentCandidate);
         * expect(isValid).toBe(true);
         *
         * // perform returns promises and tracks them.
         * var whenCopied = jasmine.createSpy('whenCopied');
         * copyService.perform(object, parentObject).then(whenCopied);
         * expect(whenCopied).not.toHaveBeenCalled();
         * copyService.perform.mostRecentCall.resolve('someArg');
         * expect(whenCopied).toHaveBeenCalledWith('someArg');
         * ```
         */
        function MockCopyService() {
            // track most recent call of a function,
            // perform automatically returns
            var mockCopyService = jasmine.createSpyObj(
                'MockCopyService',
                [
                    'validate',
                    'perform'
                ]
            );

            mockCopyService.perform.andCallFake(function () {
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

            return mockCopyService;
        }

        return MockCopyService;
    }
);
