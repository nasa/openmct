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
    ["../../src/controllers/DateTimeFieldController", "moment"],
    (DateTimeFieldController, moment) => {

        const TEST_FORMAT = "YYYY-MM-DD HH:mm:ss";

        describe("The DateTimeFieldController", () => {
            let mockScope,
                mockFormatService,
                mockFormat,
                controller;

            const fireWatch = (expr, value) => {
                mockScope.$watch.calls.forEach( (call) => {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach( () => {
                mockScope = jasmine.createSpyObj('$scope', ['$watch']);
                mockFormatService =
                    jasmine.createSpyObj('formatService', ['getFormat']);
                mockFormat = jasmine.createSpyObj('format', [
                    'parse',
                    'validate',
                    'format'
                ]);

                mockFormatService.getFormat.andReturn(mockFormat);

                mockFormat.validate.andCallFake( (text) => {
                    return moment.utc(text, TEST_FORMAT).isValid();
                });
                mockFormat.parse.andCallFake( (text) => {
                    return moment.utc(text, TEST_FORMAT).valueOf();
                });
                mockFormat.format.andCallFake( (value) => {
                    return moment.utc(value).format(TEST_FORMAT);
                });

                mockScope.ngModel = { testField: 12321 };
                mockScope.field = "testField";
                mockScope.structure = { format: "someFormat" };
                mockScope.ngBlur = jasmine.createSpy('blur');

                controller = new DateTimeFieldController(
                    mockScope,
                    mockFormatService
                );
                fireWatch("ngModel[field]", mockScope.ngModel.testField);
            });

            it("updates text from model values",  () => {
                var testTime = mockFormat.parse("1977-05-25 17:30:00");
                mockScope.ngModel.testField = testTime;
                fireWatch("ngModel[field]", testTime);
                expect(mockScope.textValue).toEqual("1977-05-25 17:30:00");
            });

            describe("when valid text is entered", () => {
                let newText;

                beforeEach( () => {
                    newText = "1977-05-25 17:30:00";
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                });

                it("updates models from user-entered text", () => {
                    expect(mockScope.ngModel.testField)
                        .toEqual(mockFormat.parse(newText));
                    expect(mockScope.textInvalid).toBeFalsy();
                });

                it("does not indicate a blur event", () => {
                    expect(mockScope.ngBlur).not.toHaveBeenCalled();
                });
            });

            describe("when a date is chosen via the date picker", () => {
                let newValue;

                beforeEach( () => {
                    newValue = 12345654321;
                    mockScope.pickerModel.value = newValue;
                    fireWatch("pickerModel.value", newValue);
                });

                it("updates models", () => {
                    expect(mockScope.ngModel.testField).toEqual(newValue);
                });

                it("fires a blur event", () => {
                    expect(mockScope.ngBlur).toHaveBeenCalled();
                });
            });

            it("exposes toggle state for date-time picker", () => {
                expect(mockScope.picker.active).toBe(false);
            });

            describe("when user input is invalid", () => {
                let newText, oldText, oldValue;

                beforeEach( () => {
                    newText = "Not a date";
                    oldValue = mockScope.ngModel.testField;
                    oldText = mockScope.textValue;
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                });

                it("displays error state", () => {
                    expect(mockScope.textInvalid).toBeTruthy();
                });

                it("does not modify model state", () => {
                    expect(mockScope.ngModel.testField).toEqual(oldValue);
                });

                it("does not modify user input", () => {
                    expect(mockScope.textValue).toEqual(newText);
                });

                it("restores valid text values on request", () => {
                    mockScope.restoreTextValue();
                    expect(mockScope.textValue).toEqual(oldText);
                });
            });

            it("does not modify valid but irregular user input", () => {
                // Don't want the controller "fixing" bad or
                // irregularly-formatted input out from under
                // the user's fingertips.
                let newText = "2015-3-3 01:02:04",
                    oldValue = mockScope.ngModel.testField;

                mockFormat.validate.andReturn(true);
                mockFormat.parse.andReturn(42);
                mockScope.textValue = newText;
                fireWatch("textValue", newText);

                expect(mockScope.textValue).toEqual(newText);
                expect(mockScope.ngModel.testField).toEqual(42);
                expect(mockScope.ngModel.testField).not.toEqual(oldValue);
            });

            it("obtains a format from the format service", () => {
                fireWatch('structure.format', mockScope.structure.format);
                expect(mockFormatService.getFormat)
                    .toHaveBeenCalledWith(mockScope.structure.format);
            });

            it("throws an error for unknown formats", () => {
                mockFormatService.getFormat.andReturn(undefined);
                expect( () => {
                    fireWatch("structure.format", "some-format");
                }).toThrow();
            });

            describe("using the obtained format", () => {
                let testValue = 1234321,
                    testText = "some text";

                beforeEach( () => {
                    mockFormat.validate.andReturn(true);
                    mockFormat.parse.andReturn(testValue);
                    mockFormat.format.andReturn(testText);
                });

                it("parses user input", () => {
                    let newText = "some other new text";
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                    expect(mockFormat.parse).toHaveBeenCalledWith(newText);
                    expect(mockScope.ngModel.testField).toEqual(testValue);
                });

                it("validates user input", () => {
                    let newText = "some other new text";
                    mockScope.textValue = newText;
                    fireWatch("textValue", newText);
                    expect(mockFormat.validate).toHaveBeenCalledWith(newText);
                });

                it("formats model data for display", () => {
                    let newValue = 42;
                    mockScope.ngModel.testField = newValue;
                    fireWatch("ngModel[field]", newValue);
                    expect(mockFormat.format).toHaveBeenCalledWith(newValue);
                    expect(mockScope.textValue).toEqual(testText);
                });
            });

        });
    }
);
