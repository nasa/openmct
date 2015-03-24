/*global define,describe,it,expect,beforeEach,waitsFor,runs,jasmine*/

define(
    ["../../src/capabilities/EditorCapability"],
    function (EditorCapability) {
        "use strict";

        describe("The editor capability", function () {
            var mockPersistence,
                mockEditableObject,
                mockDomainObject,
                mockCache,
                mockCallback,
                model,
                capability;

            beforeEach(function () {
                mockPersistence = jasmine.createSpyObj(
                    "persistence",
                    [ "persist" ]
                );
                mockEditableObject = {
                    getModel: function () { return model; }
                };
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability", "useCapability" ]
                );
                mockCache = jasmine.createSpyObj(
                    "cache",
                    [ "saveAll", "markClean" ]
                );
                mockCallback = jasmine.createSpy("callback");

                mockDomainObject.getCapability.andReturn(mockPersistence);

                model = { someKey: "some value", x: 42 };

                capability = new EditorCapability(
                    mockPersistence,
                    mockEditableObject,
                    mockDomainObject,
                    mockCache
                );
            });

            it("mutates the real domain object on nonrecursive save", function () {
                capability.save(true).then(mockCallback);

                // Wait for promise to resolve
                waitsFor(function () {
                    return mockCallback.calls.length > 0;
                }, 250);

                runs(function () {
                    expect(mockDomainObject.useCapability)
                        .toHaveBeenCalledWith("mutation", jasmine.any(Function));
                    // We should get the model from the editable object back
                    expect(
                        mockDomainObject.useCapability.mostRecentCall.args[1]()
                    ).toEqual(model);
                });
            });

            it("tells the cache to save others", function () {
                capability.save().then(mockCallback);

                // Wait for promise to resolve
                waitsFor(function () {
                    return mockCallback.calls.length > 0;
                }, 250);

                runs(function () {
                    expect(mockCache.saveAll).toHaveBeenCalled();
                });
            });

            it("has no interactions on cancel", function () {
                capability.cancel().then(mockCallback);

                // Wait for promise to resolve
                waitsFor(function () {
                    return mockCallback.calls.length > 0;
                }, 250);

                runs(function () {
                    expect(mockDomainObject.useCapability).not.toHaveBeenCalled();
                    expect(mockCache.markClean).not.toHaveBeenCalled();
                    expect(mockCache.saveAll).not.toHaveBeenCalled();
                });
            });


        });
    }
);