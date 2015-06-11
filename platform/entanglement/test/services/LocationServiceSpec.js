/*global define,describe,beforeEach,it,jasmine,expect */

define(
    [
        '../../src/services/LocationService'
    ],
    function (LocationService) {
        "use strict";

        describe("LocationService", function () {
            var dialogService,
                locationService,
                dialogServicePromise,
                chainedPromise;

            beforeEach(function () {
                dialogService = jasmine.createSpyObj(
                    'dialogService',
                    ['getUserInput']
                );
                // TODO: replace the dialogServicePromise with a deferred and
                // get rid of chainedPromise.
                dialogServicePromise = jasmine.createSpyObj(
                    'dialogServicePromise',
                    ['then']
                );
                chainedPromise = jasmine.createSpyObj(
                    'chainedPromise',
                    ['then']
                );
                dialogServicePromise.then.andReturn(chainedPromise);
                dialogService.getUserInput.andReturn(dialogServicePromise);
                locationService = new LocationService(dialogService);
            });

            describe("getLocationFromUser", function () {
                var title,
                    label,
                    validate,
                    initialLocation,
                    locationResult,
                    formStructure,
                    formState;

                beforeEach(function () {
                    title = "Get a location to do something";
                    label = "a location";
                    validate = function () { return true; };
                    initialLocation = { key: "a key" };
                    locationResult = locationService.getLocationFromUser(
                        title,
                        label,
                        validate,
                        initialLocation
                    );
                    formStructure = dialogService
                        .getUserInput
                        .mostRecentCall
                        .args[0];
                    formState = dialogService
                        .getUserInput
                        .mostRecentCall
                        .args[1];
                });

                it("calls through to dialogService", function () {
                    expect(dialogService.getUserInput).toHaveBeenCalledWith(
                        jasmine.any(Object),
                        jasmine.any(Object)
                    );
                    expect(formStructure.name).toBe(title);
                });

                it("returns a promise", function () {
                    // This test is testing that chainedPromise is returned.
                    // TODO: have better assumptions with deferred objects.
                    expect(locationResult.then).toBeDefined();
                });

                describe("formStructure", function () {
                    var locationSection,
                        inputRow;

                    beforeEach(function () {
                        locationSection = formStructure.sections[0];
                        inputRow = locationSection.rows[0];
                    });

                    it("has a location section", function () {
                        expect(locationSection).toBeDefined();
                        expect(locationSection.name).toBe('Location');
                    });

                    it("has a input row", function () {
                        expect(inputRow.control).toBe('locator');
                        expect(inputRow.key).toBe('location');
                        expect(inputRow.name).toBe(label);
                        expect(inputRow.validate).toBe(validate);
                    });
                });

                describe("formState", function () {
                    it("has an initial location", function () {
                        expect(formState.location).toBe(initialLocation);
                    });
                });

                describe("resolution of dialog service promise", function () {
                    var resolution,
                        resolver,
                        dialogResult,
                        selectedLocation;

                    beforeEach(function () {
                        resolver =
                            dialogServicePromise.then.mostRecentCall.args[0];

                        selectedLocation = { key: "i'm a location key" };
                        dialogResult = {
                            location: selectedLocation
                        };

                        resolution = resolver(dialogResult);
                    });

                    it("returns selectedLocation", function () {
                        expect(resolution).toBe(selectedLocation);
                    });
                });
            });
        });
    }
);
