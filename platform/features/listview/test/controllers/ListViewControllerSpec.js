define(
    ["../../src/controllers/ListViewController"],
    function (ListViewController) {
        describe("The Controller for the ListView", function (){
            var scope,
                unlistenFunc,
                domainObject,
                compositionObject,
                controller,
                updateViewSpy;
            beforeEach(function () {
                scope = jasmine.createSpyObj(
                    "$scope",
                    ["$on"]
                );
                domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "useCapability"]
                );
                compositionObject = jasmine.createSpyObj(
                    "compositionObject",
                    ["getModel", "getCapability"]
                );
                compositionModelObject = jasmine.createSpyObj(
                    "compositionModelObject",
                    ["persisted", "modified", "name"]
                );
                typeCapability = jasmine.createSpyObj(
                    "typeCapability",
                    ["getCssClass", "getName"]
                );
                mutationCapability = jasmine.createSpyObj(
                    "mutationCapability",
                    ["listen"]
                );
                unlistenFunc = jasmine.createSpy("unlisten");
                mutationCapability.listen.andReturn(unlistenFunc);
                typeCapability.getCssClass.andReturn("icon-folder");
                typeCapability.getName.andReturn("Folder");
                compositionObject.getCapability.andReturn(
                    typeCapability
                );
                compositionModelObject.persisted = 1496867697303
                compositionModelObject.modified = 1496867697303
                compositionModelObject.name = "Battery Charge Status"
                compositionObject.model = compositionModelObject
                domainObject.useCapability.andReturn(
                    Promise.resolve([compositionObject])
                );
                domainObject.getCapability.andReturn(
                    mutationCapability
                )
                scope.domainObject = domainObject;
                controller  = new ListViewController(scope);
                waitsFor(function () {
                    return scope.composees
                })
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
                })
                runs(function () {
                    expect(scope.composees.length).toEqual(0)
                })
            });
            it("releases listeners on $destroy", function () {
                expect(scope.$on).toHaveBeenCalledWith('$destroy', jasmine.any(Function));
                scope.$on.mostRecentCall.args[1]();
                expect(unlistenFunc).toHaveBeenCalled();
            });


        });
    }
);
