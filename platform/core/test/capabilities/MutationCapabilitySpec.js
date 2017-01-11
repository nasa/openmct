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

/**
 * MutationCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    [
        "../../src/capabilities/MutationCapability",
        "../../src/services/Topic"
    ],
    (MutationCapability, Topic) => {

        describe("The mutation capability", () => {
            let testModel,
                topic,
                mockNow,
                domainObject = {
                    getId: () => {
                        return "test-id";
                    },
                    getModel: () => {
                        return testModel;
                    }
                },
                mutation;

            beforeEach(() => {
                testModel = { number: 6 };
                topic = new Topic();
                mockNow = jasmine.createSpy('now');
                mockNow.andReturn(12321);
                mutation = new MutationCapability(
                    topic,
                    mockNow,
                    domainObject
                );
            });

            it("allows mutation of a model", () => {
                mutation.invoke( (m) => {
                    m.number = m.number * 7;
                });
                expect(testModel.number).toEqual(42);
            });

            it("allows setting a model", () => {
                mutation.invoke(() => {
                    return { someKey: "some value" };
                });
                expect(testModel.number).toBeUndefined();
                expect(testModel.someKey).toEqual("some value");
            });

            it("allows model mutation to be aborted", () => {
                mutation.invoke( (m) => {
                    m.number = m.number * 7;
                    return false; // Should abort change
                });
                // Number should not have been changed
                expect(testModel.number).toEqual(6);
            });

            it("attaches a timestamp on mutation", () => {
                // Verify precondition
                expect(testModel.modified).toBeUndefined();
                mutation.invoke( (m) => {
                    m.number = m.number * 7;
                });
                // Should have gotten a timestamp from 'now'
                expect(testModel.modified).toEqual(12321);
            });

            it("allows a timestamp to be provided", () => {
                mutation.invoke( (m) => {
                    m.number = m.number * 7;
                }, 42);
                // Should have gotten a timestamp from 'now'
                expect(testModel.modified).toEqual(42);
            });

            it("notifies listeners of mutation", () => {
                let mockCallback = jasmine.createSpy('callback');
                mutation.listen(mockCallback);
                mutation.invoke( (m) => {
                    m.number = 8;
                });
                expect(mockCallback).toHaveBeenCalled();
                expect(mockCallback.mostRecentCall.args[0].number)
                    .toEqual(8);
            });

            it("allows listeners to stop listening", () => {
                let mockCallback = jasmine.createSpy('callback');
                mutation.listen(mockCallback)(); // Unlisten immediately
                mutation.invoke( (m) => {
                    m.number = 8;
                });
                expect(mockCallback).not.toHaveBeenCalled();
            });

            it("shares listeners across instances", () => {
                let mockCallback = jasmine.createSpy('callback'),
                    otherMutation = new MutationCapability(
                        topic,
                        mockNow,
                        domainObject
                    );
                mutation.listen(mockCallback);
                otherMutation.invoke( (m) => {
                    m.number = 8;
                });
                expect(mockCallback).toHaveBeenCalled();
                expect(mockCallback.mostRecentCall.args[0].number)
                    .toEqual(8);
            });
        });
    }
);
