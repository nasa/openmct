define(
    ["../../src/controllers/ListViewController"],
    function (ListViewController) {
        describe("The Controller for the ListView", function () {
            var scope,
                unlistenFunc,
                domainObject,
                compositionObject,
                controller,
                compositionModel,
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


                compositionModel = jasmine.createSpyObj(
                    "compositionModel",
                    ["persisted", "modified", "name"]
                );
                compositionModel.persisted = 1496867697303;
                compositionModel.modified = 1496867697303;
                compositionModel.name = "Battery Charge Status";

                compositionObject = jasmine.createSpyObj(
                    "compositionObject",
                    ["getModel", "getCapability"]
                );
                compositionObject.getModel.andReturn(
                    compositionModel
                );
                compositionObject.getCapability.andReturn(
                    typeCapability
                );

                domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "useCapability"]
                );
                domainObject.useCapability.andReturn(
                    Promise.resolve([compositionObject])
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
                    return scope.composees;
                });
            });
            it("updates the view", function () {
                expect(scope.composees[0]).toEqual(
                    {
                        icon: "icon-folder",
                        title: "Battery Charge Status",
                        type: "Folder",
                        persisted: "Wed, 07 Jun 2017 20:34:57 GMT",
                        modified: "Wed, 07 Jun 2017 20:34:57 GMT",
                        asDomainObject: compositionObject
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
                    return scope.composees.length !== 1;
                });
                runs(function () {
                    expect(scope.composees.length).toEqual(0);
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
