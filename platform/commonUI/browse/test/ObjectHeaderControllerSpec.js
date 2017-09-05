/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
	["../src/ObjectHeaderController"],
	function (ObjectHeaderController) {

		describe("The object header controller", function () {
			var mockScope,
				mockDomainObject,
				mockMutationCapability,
				mockEvent,
				mockCurrentTarget,
				controller;

			function getModel() {
				return {
					name: 'Test name'
				};
			}

			beforeEach(function () {
				mockMutationCapability = jasmine.createSpyObj("mutation", ["mutate"]);

				mockDomainObject = jasmine.createSpyObj("domainObject", ["getCapability", "model"]);
				mockDomainObject.model = getModel();
				mockDomainObject.getCapability.andReturn(mockMutationCapability);

				mockScope = jasmine.createSpyObj("$scope", ["name"]);
				mockScope.domainObject = mockDomainObject;

				mockCurrentTarget = jasmine.createSpyObj("currentTarget", ["blur"]);
				mockCurrentTarget.blur.andReturn({ blur: function () {} });

				mockEvent = jasmine.createSpyObj('event', ["which"]);
				mockEvent.currentTarget = mockCurrentTarget;

				controller = new ObjectHeaderController(mockScope);
			});

			it("updates the model with new name", function () {
				mockScope.name = 'New name';
				controller.updateName();

				expect(mockMutationCapability.mutate).toHaveBeenCalledWith(jasmine.any(Function));
			});

			it("does not update the model for blank names", function () {
				mockScope.name = "";
				controller.updateName();

				expect(mockMutationCapability.mutate).not.toHaveBeenCalled();
			});

			it("updates the model on enter keypress event only", function () {
				mockScope.name = 'New name';
				controller.updateName(mockEvent);

				expect(mockMutationCapability.mutate).not.toHaveBeenCalled();

				mockEvent.which = 13;
				controller.updateName(mockEvent);

				expect(mockMutationCapability.mutate).toHaveBeenCalled();
			});

			it("blurs the field on enter key press", function () {
				mockEvent.which = 13;
				controller.updateName(mockEvent);

				expect(mockEvent.currentTarget.blur).toHaveBeenCalled();
			});
		});
	}
);
