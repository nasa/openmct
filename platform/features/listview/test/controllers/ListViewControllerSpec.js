/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    ["../../src/controllers/ListViewController"],
    function (ListViewController) {
        describe("The Controller for the ListView", function () {
            var scope,
                unlistenFunc,
                domainObject,
                childObject,
                childModel,
                typeCapability,
                mutationCapability,
                formatService,
                compositionPromise,
                controller;

            beforeEach(function () {
                unlistenFunc = jasmine.createSpy("unlisten");

                mutationCapability = jasmine.createSpyObj(
                    "mutationCapability",
                    ["listen"]
                );
                mutationCapability.listen.and.returnValue(unlistenFunc);

                formatService = jasmine.createSpyObj(
                    "formatService",
                    ["getFormat"]
                );
                formatService.getFormat.and.returnValue(jasmine.createSpyObj(
                    'utc',
                    ["format"]
                ));
                formatService.getFormat().format.and.callFake(function (v) {
                    return "formatted " + v;
                });

                typeCapability = jasmine.createSpyObj(
                    "typeCapability",
                    ["getCssClass", "getName"]
                );
                typeCapability.getCssClass.and.returnValue("icon-folder");
                typeCapability.getName.and.returnValue("Folder");


                childModel = jasmine.createSpyObj(
                    "childModel",
                    ["persisted", "modified", "name"]
                );
                childModel.persisted = 1496867697303;
                childModel.modified = 1496867697303;
                childModel.name = "Battery Charge Status";

                childObject = jasmine.createSpyObj(
                    "childObject",
                    ["getModel", "getCapability"]
                );
                childObject.getModel.and.returnValue(
                    childModel
                );

                childObject.getCapability.and.callFake(function (arg) {
                    if (arg === 'location') {
                        return '';
                    } else if (arg === 'type') {
                        return typeCapability;
                    }
                });
                childObject.location = '';

                domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "useCapability"]
                );
                compositionPromise = Promise.resolve([childObject]);
                domainObject.useCapability.and.returnValue(compositionPromise);
                domainObject.getCapability.and.returnValue(
                    mutationCapability
                );

                scope = jasmine.createSpyObj(
                    "$scope",
                    ["$on", "$apply"]
                );
                scope.domainObject = domainObject;

                controller = new ListViewController(scope, formatService);

                return compositionPromise;
            });

            it("uses the UTC time format", function () {
                expect(formatService.getFormat).toHaveBeenCalledWith('utc');
            });

            it("updates the view", function () {
                var child = scope.children[0];
                var testChild = {
                    icon: "icon-folder",
                    title: "Battery Charge Status",
                    type: "Folder",
                    persisted: formatService.getFormat('utc')
                        .format(childModel.persisted),
                    modified: formatService.getFormat('utc')
                        .format(childModel.modified),
                    asDomainObject: childObject,
                    location: '',
                    action: childObject.getCapability('action')
                };

                expect(child).toEqual(testChild);
            });
            it("updates the scope when mutation occurs", function () {
                var applyPromise = new Promise(function (resolve) {
                    scope.$apply.and.callFake(resolve);
                });

                domainObject.useCapability.and.returnValue(Promise.resolve([]));
                expect(mutationCapability.listen).toHaveBeenCalledWith(jasmine.any(Function));
                mutationCapability.listen.calls.mostRecent().args[0]();

                return applyPromise.then(function () {
                    expect(scope.children.length).toEqual(0);
                    expect(scope.$apply).toHaveBeenCalled();
                });
            });
            it("releases listeners on $destroy", function () {
                expect(scope.$on).toHaveBeenCalledWith('$destroy', jasmine.any(Function));
                scope.$on.calls.mostRecent().args[1]();
                expect(unlistenFunc).toHaveBeenCalled();
            });


        });
    }
);
