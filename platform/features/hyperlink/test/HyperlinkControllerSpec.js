define(
    ["../src/HyperlinkController"],
    function (HyperlinkController) {

        describe("The controller for hyperlinks", function () {
            var scope,
                domainObject,
                model
                link="http://nasa.gov"
            beforeEach(function () {
              domainObject = jasmine.createSpyObj(
                  "domainObject",
                  ["getModel"]
              );
              model = jasmine.createSpyObj(
                "getModel",
                ["link"]
              );
              domainObject.getModel.link= link
            });
            it("opens a specific given link", function () {
                expect(domainObject.getModel.link)
                    .toEqual("http://nasa.gov");
            });

        });
    }
);
