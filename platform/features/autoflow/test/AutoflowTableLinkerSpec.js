
define(
    ["../src/AutoflowTableLinker"],
    function (AutoflowTableLinker) {

        describe("The mct-autoflow-table linker", function () {
            var cachedAngular,
                mockAngular,
                mockScope,
                mockElement,
                mockElements,
                linker;

            // Utility function to generate more mock elements
            function createMockElement(html) {
                var mockEl = jasmine.createSpyObj(
                    "element-" + html,
                    [
                        "append",
                        "addClass",
                        "removeClass",
                        "text",
                        "attr",
                        "html",
                        "css",
                        "find"
                    ]
                );
                mockEl.testHtml = html;
                mockEl.append.andReturn(mockEl);
                mockElements.push(mockEl);
                return mockEl;
            }

            function createMockDomainObject(id) {
                var mockDomainObject = jasmine.createSpyObj(
                    "domainObject-" + id,
                    ["getId", "getModel"]
                );
                mockDomainObject.getId.andReturn(id);
                mockDomainObject.getModel.andReturn({name: id.toUpperCase()});
                return mockDomainObject;
            }

            function fireWatch(watchExpression, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === watchExpression) {
                        call.args[1](value);
                    }
                });
            }

            // AutoflowTableLinker accesses Angular in the global
            // scope, since it is not injectable; we simulate that
            // here by adding/removing it to/from the window object.
            beforeEach(function () {
                mockElements = [];

                mockAngular = jasmine.createSpyObj("angular", ["element"]);
                mockScope = jasmine.createSpyObj("scope", ["$watch"]);
                mockElement = createMockElement('<div>');

                mockAngular.element.andCallFake(createMockElement);

                if (window.angular !== undefined) {
                    cachedAngular = window.angular;
                }
                window.angular = mockAngular;

                linker = new AutoflowTableLinker(mockScope, mockElement);
            });

            afterEach(function () {
                if (cachedAngular !== undefined) {
                    window.angular = cachedAngular;
                } else {
                    delete window.angular;
                }
            });

            it("watches for changes in inputs", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "objects",
                    jasmine.any(Function)
                );
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "rows",
                    jasmine.any(Function)
                );
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "counter",
                    jasmine.any(Function)
                );
            });

            it("changes structure when domain objects change", function () {
                // Set up scope
                mockScope.rows = 4;
                mockScope.objects = ['a', 'b', 'c', 'd', 'e', 'f']
                    .map(createMockDomainObject);

                // Fire an update to the set of objects
                fireWatch("objects");

                // Should have rebuilt with two columns of
                // four and two rows each; first, by clearing...
                expect(mockElement.html).toHaveBeenCalledWith("");

                // Should have appended two columns...
                expect(mockElement.append.calls.length).toEqual(2);

                // ...which should have received two and four rows each
                expect(mockElement.append.calls[0].args[0].append.calls.length)
                    .toEqual(4);
                expect(mockElement.append.calls[1].args[0].append.calls.length)
                    .toEqual(2);
            });

            it("updates values", function () {
                var mockSpans;

                mockScope.objects = ['a', 'b', 'c', 'd', 'e', 'f']
                    .map(createMockDomainObject);
                mockScope.values = { a: 0 };

                // Fire an update to the set of values
                fireWatch("objects");
                fireWatch("updated");

                // Get all created spans
                mockSpans = mockElements.filter(function (mockElem) {
                    return mockElem.testHtml === '<span>';
                });

                // First span should be a, should have gotten this value.
                // This test detects, in particular, WTD-749
                expect(mockSpans[0].text).toHaveBeenCalledWith('A');
                expect(mockSpans[1].text).toHaveBeenCalledWith(0);
            });

            it("listens for changes in column width", function () {
                var mockUL = createMockElement("<ul>");
                mockElement.find.andReturn(mockUL);
                mockScope.columnWidth = 200;
                fireWatch("columnWidth", mockScope.columnWidth);
                expect(mockUL.css).toHaveBeenCalledWith("width", "200px");
            });

            it("updates CSS classes", function () {
                var mockSpans;

                mockScope.objects = ['a', 'b', 'c', 'd', 'e', 'f']
                    .map(createMockDomainObject);
                mockScope.values = { a: "a value to find" };
                mockScope.classes = { a: 'class-a' };

                // Fire an update to the set of values
                fireWatch("objects");
                fireWatch("updated");

                // Figure out which span holds the relevant value...
                mockSpans = mockElements.filter(function (mockElem) {
                    return mockElem.testHtml === '<span>';
                }).filter(function (mockSpan) {
                    var attrCalls = mockSpan.attr.calls;
                    return attrCalls.some(function (call) {
                        return call.args[0] === 'title' &&
                                call.args[1] === mockScope.values.a;
                    });
                });

                // ...and make sure it also has had its class applied
                expect(mockSpans[0].addClass)
                    .toHaveBeenCalledWith(mockScope.classes.a);
            });
        });
    }
);
