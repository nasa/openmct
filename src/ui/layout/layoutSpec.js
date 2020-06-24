import Vue from 'vue';
import {
    createOpenMct,
    createMouseEvent,
    spyOnBuiltins,
    resetApplicationState,
    generatePromises,
    getMockObjects
} from 'utils/testing';

fdescribe("the tree navigation", () => {
    let openmct,
        element,
        child;

    beforeAll(() => {
        resetApplicationState();
    })

    beforeEach((done) => {
        openmct = createOpenMct();

        // spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve([]));
        spyOn(openmct.composition, 'get').and.returnValue(Promise.resolve([]));

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.time.timeSystem('utc', {start: 0, end: 4});

        spyOnBuiltins(['requestAnimationFrame']);
        window.requestAnimationFrame.and.callFake((callBack) => {
            callBack();
        });

        let promises = generatePromises(['root']),
            root = getMockObjects({
                objectKeyStrings: ['root']
            }).root;

        spyOn(openmct.objects, 'get').and.callFake((id) => {
            console.log('object get', id);
            if(id === 'ROOT') {
                promises.rootPromisResolve(root);
                return promises.rootPromise;
            } else {
                //
            }
        });

        openmct.on('start', done);
        openmct.start();
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    it("should be true", () => {
        let tree = document.querySelector('.c-tree-and-search');
        console.log('tree', tree);
        expect(true).toBe(false);
    })

    xdescribe("defines a table object", function () {
        it("that is creatable", () => {
            let tableType = openmct.types.get('table');
            expect(tableType.definition.creatable).toBe(true);
        });
    })

    xit("provides a table view for objects with telemetry", () => {
        const testTelemetryObject = {
            id:"test-object",
            type: "test-object",
            telemetry: {
                values: [{
                    key: "some-key"
                }]
            }
        };

        const applicableViews = openmct.objectViews.get(testTelemetryObject);
        let tableView = applicableViews.find((viewProvider) => viewProvider.key === 'table');
        expect(tableView).toBeDefined();
    });

    xdescribe("The table view", () => {
        let testTelemetryObject;
        let applicableViews;
        let tableViewProvider;
        let tableView;

        beforeEach(() => {
            testTelemetryObject = {
                identifier:{ namespace: "", key: "test-object"},
                type: "test-object",
                name: "Test Object",
                telemetry: {
                    values: [{
                        key: "utc",
                        format: "utc",
                        name: "Time",
                        hints: {
                            domain: 1
                        }
                    },{
                        key: "some-key",
                        name: "Some attribute",
                        hints: {
                            range: 1
                        }
                    }, {
                        key: "some-other-key",
                        name: "Another attribute",
                        hints: {
                            range: 2
                        }
                    }]
                }
            };
            const testTelemetry = [
                {
                    'utc': 1,
                    'some-key': 'some-value 1',
                    'some-other-key' : 'some-other-value 1'
                },
                {
                    'utc': 2,
                    'some-key': 'some-value 2',
                    'some-other-key' : 'some-other-value 2'
                },
                {
                    'utc': 3,
                    'some-key': 'some-value 3',
                    'some-other-key' : 'some-other-value 3'
                }
            ];
            let telemetryPromiseResolve;
            let telemetryPromise = new Promise((resolve) => {
                telemetryPromiseResolve = resolve;
            });
            openmct.telemetry.request.and.callFake(() => {
                telemetryPromiseResolve(testTelemetry);
                return telemetryPromise;
            });

            applicableViews = openmct.objectViews.get(testTelemetryObject);
            tableViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'table');
            tableView = tableViewProvider.view(testTelemetryObject, [testTelemetryObject]);
            tableView.show(child, true);

            return telemetryPromise.then(() => Vue.nextTick());
        });

        it("Renders a row for every telemetry datum returned",() => {
            let rows = element.querySelectorAll('table.c-telemetry-table__body tr');
            expect(rows.length).toBe(3);
        });


        it("Renders a column for every item in telemetry metadata",() => {
            let headers = element.querySelectorAll('span.c-telemetry-table__headers__label');
            expect(headers.length).toBe(3);
            expect(headers[0].innerText).toBe('Time');
            expect(headers[1].innerText).toBe('Some attribute');
            expect(headers[2].innerText).toBe('Another attribute');
        });

        it("Supports column reordering via drag and drop",() => {
            let columns = element.querySelectorAll('tr.c-telemetry-table__headers__labels th');
            let fromColumn = columns[0];
            let toColumn = columns[1];
            let fromColumnText = fromColumn.querySelector('span.c-telemetry-table__headers__label').innerText;
            let toColumnText = toColumn.querySelector('span.c-telemetry-table__headers__label').innerText;

            let dragStartEvent = createMouseEvent('dragstart');
            let dragOverEvent = createMouseEvent('dragover');
            let dropEvent = createMouseEvent('drop');

            dragStartEvent.dataTransfer =
                dragOverEvent.dataTransfer =
                    dropEvent.dataTransfer = new DataTransfer();

            fromColumn.dispatchEvent(dragStartEvent);
            toColumn.dispatchEvent(dragOverEvent);
            toColumn.dispatchEvent(dropEvent);

            return Vue.nextTick().then(() => {
                columns = element.querySelectorAll('tr.c-telemetry-table__headers__labels th');
                let firstColumn = columns[0];
                let secondColumn = columns[1];
                let firstColumnText = firstColumn.querySelector('span.c-telemetry-table__headers__label').innerText;
                let secondColumnText = secondColumn.querySelector('span.c-telemetry-table__headers__label').innerText;

                expect(fromColumnText).not.toEqual(firstColumnText);
                expect(fromColumnText).toEqual(secondColumnText);
                expect(toColumnText).not.toEqual(secondColumnText);
                expect(toColumnText).toEqual(firstColumnText);
            });
        });
    });
});
