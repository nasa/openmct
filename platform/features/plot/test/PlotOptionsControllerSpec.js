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
/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../src/PlotOptionsController'],
    function (PlotOptionsController) {
        "use strict";

        describe("The Plot Options controller", function () {
            var plotOptionsController,
                mockDomainObject,
                mockMutationCapability,
                mockUseCapabilities,
                mockCompositionCapability,
                mockComposition,
                mockUnlisten,
                mockFormUnlisten,
                mockChildOne,
                mockChildTwo,
                model,
                mockScope;

            beforeEach(function () {
                model = {
                    composition: ['childOne']
                };

                mockChildOne = jasmine.createSpyObj('domainObject', [
                   'getId'
                ]);
                mockChildOne.getId.andReturn('childOne');

                mockChildTwo = jasmine.createSpyObj('childTwo', [
                    'getId'
                ]);
                mockChildOne.getId.andReturn('childTwo');

                mockCompositionCapability = jasmine.createSpyObj('compositionCapability', [
                    'then'
                ]);
                mockComposition = [
                    mockChildOne
                ];
                mockCompositionCapability.then.andCallFake(function (callback){
                    callback(mockComposition);
                });

                mockUseCapabilities = jasmine.createSpyObj('useCapabilities', [
                    'composition',
                    'mutation'
                ]);
                mockUseCapabilities.composition.andReturn(mockCompositionCapability);

                mockMutationCapability = jasmine.createSpyObj('mutationCapability', [
                    'listen'
                ]);
                mockUnlisten = jasmine.createSpy('unlisten');
                mockMutationCapability.listen.andReturn(mockUnlisten);

                mockDomainObject = jasmine.createSpyObj('domainObject', [
                    'getModel',
                    'useCapability',
                    'getCapability'
                ]);
                mockDomainObject.useCapability.andCallFake(function(capability){
                    return mockUseCapabilities[capability]();
                });
                mockDomainObject.getCapability.andReturn(mockMutationCapability);
                mockDomainObject.getModel.andReturn(model);

                mockScope = jasmine.createSpyObj('scope', [
                    '$on',
                    '$watchCollection'
                ]);
                mockScope.domainObject = mockDomainObject;

                function noop() {}
                mockScope.$watchCollection.andReturn(noop);

                plotOptionsController = new PlotOptionsController(mockScope);
            });

            it("sets form definitions on scope", function () {
                expect(mockScope.xAxisForm).toBeDefined();
                expect(mockScope.yAxisForm).toBeDefined();
                expect(mockScope.plotSeriesForm).toBeDefined();
            });

            it("sets object children on scope", function () {
                expect(mockScope.children).toBe(mockComposition);
            });

            it("on changes in object composition, updates the form", function () {
                expect(mockMutationCapability.listen).toHaveBeenCalled();
                expect(mockScope.children).toBe(mockComposition);
                expect(mockScope.children.length).toBe(1);
                mockComposition.push(mockChildTwo);
                model.composition.push('childTwo');
                mockMutationCapability.listen.mostRecentCall.args[0](model);
                expect(mockScope.children).toBe(mockComposition);
                expect(mockScope.children.length).toBe(2);
            });

            it("on changes in form values, updates the object model", function () {
                var scopeConfiguration = mockScope.configuration,
                    model = mockDomainObject.getModel();

                scopeConfiguration.plot.yAxis.autoScale = true;
                scopeConfiguration.plot.yAxis.key = 'eu';
                scopeConfiguration.plot.xAxis.key = 'lst';

                expect(mockScope.$watchCollection).toHaveBeenCalled();
                mockScope.$watchCollection.calls[0].args[1]();
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith('mutation', jasmine.any(Function));

                mockDomainObject.useCapability.mostRecentCall.args[1](model);
                expect(model.configuration.plot.yAxis.autoScale).toBe(true);
                expect(model.configuration.plot.yAxis.key).toBe('eu');
                expect(model.configuration.plot.xAxis.key).toBe('lst');

            });

            it("cleans up listeners on destruction of the controller", function () {
                mockScope.$on.mostRecentCall.args[1]();
                expect(mockUnlisten).toHaveBeenCalled();
            });

        });
    }
);
