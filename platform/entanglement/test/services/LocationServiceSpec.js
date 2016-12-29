/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/


define(
    [
        '../../src/services/LocationService'
    ],
    (LocationService) => {

        describe("LocationService", () =>  {
            let dialogService,
                locationService,
                dialogServicePromise,
                chainedPromise;

            beforeEach(() =>  {
                dialogService = jasmine.createSpyObj(
                    'dialogService',
                    ['getUserInput']
                );
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

            describe("getLocationFromUser", () =>  {
                let title,
                    label,
                    validate,
                    initialLocation,
                    locationResult,
                    formStructure,
                    formState;

                beforeEach(() =>  {
                    title = "Get a location to do something";
                    label = "a location";
                    validate = () =>  {
                        return true;
                    };
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

                it("calls through to dialogService", () =>  {
                    expect(dialogService.getUserInput).toHaveBeenCalledWith(
                        jasmine.any(Object),
                        jasmine.any(Object)
                    );
                    expect(formStructure.name).toBe(title);
                });

                it("returns a promise", () =>  {
                    expect(locationResult.then).toBeDefined();
                });

                describe("formStructure", () =>  {
                    let locationSection,
                        inputRow;

                    beforeEach(() =>  {
                        locationSection = formStructure.sections[0];
                        inputRow = locationSection.rows[0];
                    });

                    it("has a location section", () =>  {
                        expect(locationSection).toBeDefined();
                        expect(locationSection.name).toBe('Location');
                    });

                    it("has a input row", () =>  {
                        expect(inputRow.control).toBe('locator');
                        expect(inputRow.key).toBe('location');
                        expect(inputRow.name).toBe(label);
                        expect(inputRow.validate).toBe(validate);
                    });
                });

                describe("formState", () =>  {
                    it("has an initial location", () =>  {
                        expect(formState.location).toBe(initialLocation);
                    });
                });

                describe("resolution of dialog service promise", () =>  {
                    let resolution,
                        resolver,
                        dialogResult,
                        selectedLocation;

                    beforeEach(() =>  {
                        resolver =
                            dialogServicePromise.then.mostRecentCall.args[0];

                        selectedLocation = { key: "i'm a location key" };
                        dialogResult = {
                            location: selectedLocation
                        };

                        resolution = resolver(dialogResult);
                    });

                    it("returns selectedLocation", () =>  {
                        expect(resolution).toBe(selectedLocation);
                    });
                });
            });
        });
    }
);
