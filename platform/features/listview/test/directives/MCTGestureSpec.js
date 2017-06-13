define(
    ["../../src/directives/MCTGesture"],
    function (MCTGesture) {
        describe("The Gesture Listener for the ListView items", function () {
            var mctGesture,
                gestureService,
                scope,
                element,
                attrs;
            beforeEach(function () {
                attachedGesture = jasmine.createSpyObj(
                    "attachedGesture",
                    ['destroy']
                )
                gestureService = jasmine.createSpyObj(
                    "gestureService",
                    ["attachGestures"]
                );
                gestureService.attachGestures.andReturn(
                    attachedGesture
                )
                mctGesture = MCTGesture(gestureService);
            })
            it("creates a directive Object", function () {
                expect(mctGesture).toBeDefined()
            });
            it("has link function that attaches gesture to gestureService",
                function () {
                    attrs = {
                        mctGesture: "menu,info"
                    };
                    element = jasmine.createSpy("element");
                    scope = jasmine.createSpyObj(
                        "$scope",
                        ["$on"]
                    )
                    scope.domainObject = "fake domainObject"
                    mctGesture.link(scope,element,attrs);
                    expect(gestureService.attachGestures).toHaveBeenCalled();
                    expect(gestureService.attachGestures).toHaveBeenCalledWith(
                        element,
                        "fake domainObject",
                        ["menu","info"]
                    );

            });
            it("release gesture service on $destroy", function () {
                attrs = {
                    mctGesture: "menu,info"
                };
                element = jasmine.createSpy("element");
                scope = jasmine.createSpyObj(
                    "$scope",
                    ["$on"]
                )
                scope.domainObject = "fake domainObject"
                mctGesture.link(scope,element,attrs);
                expect(scope.$on).toHaveBeenCalledWith(
                    '$destroy',
                     jasmine.any(Function)
                );
                //console.log(scope.$on.mostRecentCall.args[1])
                scope.$on.mostRecentCall.args[1]();
                execpt(gestureService.destroy).toHaveBeenCalled()
            })

        });
    }
);
