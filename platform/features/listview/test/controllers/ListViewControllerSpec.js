define(
    ["../../src/controllers/ListViewController"],
    function (ListViewController) {
        describe("The Controller for the ListView", function () {
            var scope,
                unlistenFunc,
                domainObject,
                childObject,
                controller,
                childModel,
                typeCapability,
                mutationCapability;
            beforeEach(function () {
                unlistenFunc = jasmine.createSpy("unlisten");

                mutationCapability = jasmine.createSpyObj(
                    "mutationCapability",
                    ["listen"]
                );
                mutationCapability.listen.andReturn(unlistenFunc);

                typeCapability = jasmine.createSpyObj(
                    "typeCapability",
                    ["getCssClass", "getName"]
                );
                typeCapability.getCssClass.andReturn("icon-folder");
                typeCapability.getName.andReturn("Folder");


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
                childObject.getModel.andReturn(
                    childModel
                );
                childObject.getCapability.andReturn(
                    typeCapability
                );

                domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "useCapability"]
                );
                domainObject.useCapability.andReturn(
                    Promise.resolve([childObject])
                );
                domainObject.getCapability.andReturn(
                    mutationCapability
                );

                scope = jasmine.createSpyObj(
                    "$scope",
                    ["$on"]
                );
                scope.domainObject = domainObject;

                controller  = new ListViewController(scope);

                waitsFor(function () {
                    return scope.children;
                });
            });
            it("updates the view", function () {
                expect(scope.children[0]).toEqual(
                    {
                        icon: "icon-folder",
                        title: "Battery Charge Status",
                        type: "Folder",
                        persisted: "Wed, 07 Jun 2017 20:34:57 GMT",
                        modified: "Wed, 07 Jun 2017 20:34:57 GMT",
                        asDomainObject: childObject
                    }
                );
            });
            it("updates the scope when mutation occurs", function () {
                domainObject.useCapability.andReturn(
                    Promise.resolve([])
                );
                expect(mutationCapability.listen).toHaveBeenCalledWith(jasmine.any(Function));
                mutationCapability.listen.mostRecentCall.args[0]();
                waitsFor(function () {
                    return scope.children.length !== 1;
                });
                runs(function () {
                    expect(scope.children.length).toEqual(0);
                });
            });
            it("releases listeners on $destroy", function () {
                expect(scope.$on).toHaveBeenCalledWith('$destroy', jasmine.any(Function));
                scope.$on.mostRecentCall.args[1]();
                expect(unlistenFunc).toHaveBeenCalled();
            });


        });
    }
);
