/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*jshint latedef: nofunc */
define([
    "./MeanTelemetryProvider",
    "./MockTelemetryApi"
], function (
    MeanTelemetryProvider,
    MockTelemetryApi
) {
    var RANGE_KEY = 'value';

    describe("The Mean Telemetry Provider", function () {
        var mockApi;
        var meanTelemetryProvider;
        var mockDomainObject;
        var associatedObject;
        var allPromises;

        beforeEach(function () {
            allPromises = [];
            createMockApi();
            setTimeSystemTo('utc');
            createMockObjects();
            meanTelemetryProvider = new MeanTelemetryProvider(mockApi);
        });

        it("supports telemetry-mean objects only", function () {
            var mockTelemetryMeanObject = mockObjectWithType('telemetry-mean');
            var mockOtherObject = mockObjectWithType('other');

            expect(meanTelemetryProvider.canProvideTelemetry(mockTelemetryMeanObject)).toBe(true);
            expect(meanTelemetryProvider.canProvideTelemetry(mockOtherObject)).toBe(false);
        });

        describe("the subscribe function", function () {
            var subscriptionCallback;

            beforeEach(function () {
                subscriptionCallback = jasmine.createSpy('subscriptionCallback');
            });

            it("subscribes to telemetry for the associated object", function () {
                meanTelemetryProvider.subscribe(mockDomainObject);
                return expectObjectWasSubscribedTo(associatedObject);
            });

            it("returns a function that unsubscribes from the associated object", function () {
                var unsubscribe = meanTelemetryProvider.subscribe(mockDomainObject);

                return waitForPromises()
                    .then(unsubscribe)
                    .then(waitForPromises)
                    .then(function () {
                        expect(mockApi.telemetry.unsubscribe).toHaveBeenCalled();
                    });
            });

            it("returns an average only when the sample size is reached", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313}
                ];

                setSampleSize(5);
                meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);
                return waitForPromises()
                    .then(feedInputTelemetry.bind(this, inputTelemetry))
                    .then(function () {
                        expect(subscriptionCallback).not.toHaveBeenCalled();
                    });
            });

            it("correctly averages a sample of five values", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313},
                    {'utc': 5, 'defaultRange': 1.1231}
                ];
                var expectedAverages = [{
                    'utc': 5, 'value': 222.44888
                }];

                setSampleSize(5);
                meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);

                return waitForPromises()
                    .then(feedInputTelemetry.bind(this, inputTelemetry))
                    .then(expectAveragesForTelemetry.bind(this, expectedAverages));
            });

            it("correctly averages a sample of ten values", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313},
                    {'utc': 5, 'defaultRange': 1.1231},
                    {'utc': 6, 'defaultRange': 2323.12},
                    {'utc': 7, 'defaultRange': 532.12},
                    {'utc': 8, 'defaultRange': 453.543},
                    {'utc': 9, 'defaultRange': 89.2111},
                    {'utc': 10, 'defaultRange': 0.543}
                ];
                var expectedAverages = [{
                    'utc': 10, 'value': 451.07815
                }];

                setSampleSize(10);
                meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);

                return waitForPromises()
                    .then(feedInputTelemetry.bind(this, inputTelemetry))
                    .then(expectAveragesForTelemetry.bind(this, expectedAverages));
            });

            it("only averages values within its sample window", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313},
                    {'utc': 5, 'defaultRange': 1.1231},
                    {'utc': 6, 'defaultRange': 2323.12},
                    {'utc': 7, 'defaultRange': 532.12},
                    {'utc': 8, 'defaultRange': 453.543},
                    {'utc': 9, 'defaultRange': 89.2111},
                    {'utc': 10, 'defaultRange': 0.543}
                ];
                var expectedAverages = [
                    {'utc': 5, 'value': 222.44888},
                    {'utc': 6, 'value': 662.4482599999999},
                    {'utc': 7, 'value': 704.6078},
                    {'utc': 8, 'value': 773.02748},
                    {'utc': 9, 'value': 679.8234399999999},
                    {'utc': 10, 'value': 679.70742}
                ];

                setSampleSize(5);
                meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);

                return waitForPromises()
                    .then(feedInputTelemetry.bind(this, inputTelemetry))
                    .then(expectAveragesForTelemetry.bind(this, expectedAverages));
            });
            describe("given telemetry input with range values", function () {
                var inputTelemetry;

                beforeEach(function () {
                    inputTelemetry = [{
                        'utc': 1,
                        'rangeKey': 5678,
                        'otherKey': 9999
                    }];
                    setSampleSize(1);
                });
                it("uses the 'rangeKey' input range, when it is the default, to calculate the average", function () {
                    var averageTelemetryForRangeKey = [{
                        'utc': 1,
                        'value': 5678
                    }];

                    meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);
                    mockApi.telemetry.setDefaultRangeTo('rangeKey');

                    return waitForPromises()
                        .then(feedInputTelemetry.bind(this, inputTelemetry))
                        .then(expectAveragesForTelemetry.bind(this, averageTelemetryForRangeKey));
                });

                it("uses the 'otherKey' input range, when it is the default, to calculate the average", function () {
                    var averageTelemetryForOtherKey = [{
                        'utc': 1,
                        'value': 9999
                    }];

                    meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);
                    mockApi.telemetry.setDefaultRangeTo('otherKey');

                    return waitForPromises()
                        .then(feedInputTelemetry.bind(this, inputTelemetry))
                        .then(expectAveragesForTelemetry.bind(this, averageTelemetryForOtherKey));
                });
            });
            describe("given telemetry input with range values", function () {
                var inputTelemetry;

                beforeEach(function () {
                    inputTelemetry = [{
                        'utc': 1,
                        'rangeKey': 5678,
                        'otherKey': 9999
                    }];
                    setSampleSize(1);
                });
                it("uses the 'rangeKey' input range, when it is the default, to calculate the average", function () {
                    var averageTelemetryForRangeKey = [{
                        'utc': 1,
                        'value': 5678
                    }];

                    meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);
                    mockApi.telemetry.setDefaultRangeTo('rangeKey');

                    return waitForPromises()
                        .then(feedInputTelemetry.bind(this, inputTelemetry))
                        .then(expectAveragesForTelemetry.bind(this, averageTelemetryForRangeKey));
                });

                it("uses the 'otherKey' input range, when it is the default, to calculate the average", function () {
                    var averageTelemetryForOtherKey = [{
                        'utc': 1,
                        'value': 9999
                    }];

                    meanTelemetryProvider.subscribe(mockDomainObject, subscriptionCallback);
                    mockApi.telemetry.setDefaultRangeTo('otherKey');

                    return waitForPromises()
                        .then(feedInputTelemetry.bind(this, inputTelemetry))
                        .then(expectAveragesForTelemetry.bind(this, averageTelemetryForOtherKey));
                });
            });

            function feedInputTelemetry(inputTelemetry) {
                inputTelemetry.forEach(mockApi.telemetry.mockReceiveTelemetry);
            }

            function expectAveragesForTelemetry(expectedAverages) {
                return waitForPromises().then(function () {
                    expectedAverages.forEach(function (averageDatum) {
                        expect(subscriptionCallback).toHaveBeenCalledWith(averageDatum);
                    });
                });
            }

            function expectObjectWasSubscribedTo(object) {
                return waitForPromises().then(function () {
                    expect(mockApi.telemetry.subscribe).toHaveBeenCalledWith(object, jasmine.any(Function));
                });
            }

        });

        describe("the request function", function () {

            it("requests telemetry for the associated object", function () {
                whenTelemetryRequestedReturn([]);
                return meanTelemetryProvider.request(mockDomainObject).then(function () {
                    expect(mockApi.telemetry.request).toHaveBeenCalledWith(associatedObject, undefined);
                });
            });

            it("returns an average only when the sample size is reached", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313}
                ];

                setSampleSize(5);
                whenTelemetryRequestedReturn(inputTelemetry);

                return meanTelemetryProvider.request(mockDomainObject).then(function (averageData) {
                    expect(averageData.length).toBe(0);
                });
            });

            it("correctly averages a sample of five values", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313},
                    {'utc': 5, 'defaultRange': 1.1231}
                ];

                setSampleSize(5);
                whenTelemetryRequestedReturn(inputTelemetry);

                return meanTelemetryProvider.request(mockDomainObject)
                    .then(function (averageData) {
                        expectAverageToBe(222.44888, averageData);
                    });
            });

            it("correctly averages a sample of ten values", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313},
                    {'utc': 5, 'defaultRange': 1.1231},
                    {'utc': 6, 'defaultRange': 2323.12},
                    {'utc': 7, 'defaultRange': 532.12},
                    {'utc': 8, 'defaultRange': 453.543},
                    {'utc': 9, 'defaultRange': 89.2111},
                    {'utc': 10, 'defaultRange': 0.543}
                ];

                setSampleSize(10);
                whenTelemetryRequestedReturn(inputTelemetry);

                return meanTelemetryProvider.request(mockDomainObject)
                    .then(function (averageData) {
                        expectAverageToBe(451.07815, averageData);
                    });
            });

            it("only averages values within its sample window", function () {
                var inputTelemetry = [
                    {'utc': 1, 'defaultRange': 123.1231},
                    {'utc': 2, 'defaultRange': 321.3223},
                    {'utc': 3, 'defaultRange': 111.4446},
                    {'utc': 4, 'defaultRange': 555.2313},
                    {'utc': 5, 'defaultRange': 1.1231},
                    {'utc': 6, 'defaultRange': 2323.12},
                    {'utc': 7, 'defaultRange': 532.12},
                    {'utc': 8, 'defaultRange': 453.543},
                    {'utc': 9, 'defaultRange': 89.2111},
                    {'utc': 10, 'defaultRange': 0.543}
                ];

                setSampleSize(5);
                whenTelemetryRequestedReturn(inputTelemetry);

                return meanTelemetryProvider.request(mockDomainObject)
                    .then(function (averageData) {
                        expectAverageToBe(679.70742, averageData);
                    });
            });

            function expectAverageToBe(expectedValue, averageData) {
                var averageDatum = averageData[averageData.length - 1];
                expect(averageDatum[RANGE_KEY]).toBe(expectedValue);
            }

            function whenTelemetryRequestedReturn(telemetry) {
                mockApi.telemetry.request.and.returnValue(resolvePromiseWith(telemetry));
            }
        });

        function createMockObjects() {
            mockDomainObject = {
                telemetryPoint: 'someTelemetryPoint'
            };
            associatedObject = {};
            mockApi.objects.get.and.returnValue(resolvePromiseWith(associatedObject));
        }

        function setSampleSize(sampleSize) {
            mockDomainObject.samples = sampleSize;
        }

        function createMockApi() {
            mockApi = {
                telemetry: new MockTelemetryApi(),
                objects: createMockObjectApi(),
                time: createMockTimeApi()
            };
        }

        function createMockObjectApi() {
            return jasmine.createSpyObj('ObjectAPI', [
                'get'
            ]);
        }

        function mockObjectWithType(type) {
            return {
                type: type
            };
        }

        function resolvePromiseWith(value) {
            var promise = Promise.resolve(value);
            allPromises.push(promise);

            return promise;
        }

        function waitForPromises() {
            return Promise.all(allPromises);
        }

        function createMockTimeApi() {
            return jasmine.createSpyObj("timeApi", ['timeSystem']);
        }

        function setTimeSystemTo(timeSystemKey) {
            mockApi.time.timeSystem.and.returnValue({
                key: timeSystemKey
            });
        }
    });

});
