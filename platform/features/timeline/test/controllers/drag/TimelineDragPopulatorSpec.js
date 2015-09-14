/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/


define(
    ['../../../src/controllers/drag/TimelineDragPopulator'],
    function (TimelineDragPopulator) {
        "use strict";

        describe("The timeline drag populator", function () {
            var mockObjectLoader,
                mockPromise,
                mockSwimlane,
                mockDomainObject,
                populator;

            beforeEach(function () {
                mockObjectLoader = jasmine.createSpyObj("objectLoader", ["load"]);
                mockPromise = jasmine.createSpyObj("promise", ["then"]);
                mockSwimlane = jasmine.createSpyObj("swimlane", ["color"]);
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "getId"]
                );

                mockSwimlane.domainObject = mockDomainObject;
                mockObjectLoader.load.andReturn(mockPromise);

                populator = new TimelineDragPopulator(mockObjectLoader);
            });

            it("loads timespans for the represented object's subgraph", function () {
                populator.populate(mockDomainObject);
                expect(mockObjectLoader.load).toHaveBeenCalledWith(
                    mockDomainObject,
                    'timespan'
                );
            });

            it("updates handles for selections", function () {
                // Ensure we have a represented object context
                populator.populate(mockDomainObject);
                // Initially, no selection and no handles
                expect(populator.get()).toEqual([]);
                // Select the swimlane
                populator.select(mockSwimlane);
                // We should have handles now
                expect(populator.get().length).toEqual(3);
            });

        });

    }
);