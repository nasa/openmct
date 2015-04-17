/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/PersistenceFailureHandler", "../src/PersistenceFailureConstants"],
    function (PersistenceFailureHandler, Constants) {
        "use strict";

        describe("The persistence failure handler", function () {
            var mockQ,
                mockDialogService,
                mockFailures,
                mockPromise,
                handler;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function makeMockFailure(id, index) {
                var mockFailure = jasmine.createSpyObj(
                        'failure-' + id,
                        ['requeue']
                    ),
                    mockPersistence = jasmine.createSpyObj(
                        'persistence-' + id,
                        ['refresh', 'persist']
                    );
                mockFailure.domainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'useCapability', 'getModel']
                );
                mockFailure.domainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });
                mockFailure.domainObject.getModel.andReturn({ id: id, modified: index });
                mockFailure.persistence = mockPersistence;
                mockFailure.id = id;
                mockFailure.error = { key: Constants.REVISION_ERROR_KEY };
                return mockFailure;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['all', 'when']);
                mockDialogService = jasmine.createSpyObj('dialogService', ['getUserChoice']);
                mockFailures = ['a', 'b', 'c'].map(makeMockFailure);
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockDialogService.getUserChoice.andReturn(mockPromise);
                mockQ.all.andReturn(mockPromise);
                mockPromise.then.andReturn(mockPromise);
                handler = new PersistenceFailureHandler(mockQ, mockDialogService);
            });

            it("shows a dialog to handle failures", function () {
                handler.handle(mockFailures);
                expect(mockDialogService.getUserChoice).toHaveBeenCalled();
            });

            it("overwrites on request", function () {
                mockQ.all.andReturn(asPromise([]));
                handler.handle(mockFailures);
                // User chooses overwrite
                mockPromise.then.mostRecentCall.args[0](Constants.OVERWRITE_KEY);
                // Should refresh, remutate, and requeue all objects
                mockFailures.forEach(function (mockFailure, i) {
                    expect(mockFailure.persistence.refresh).toHaveBeenCalled();
                    expect(mockFailure.requeue).toHaveBeenCalled();
                    expect(mockFailure.domainObject.useCapability).toHaveBeenCalledWith(
                        'mutation',
                        jasmine.any(Function),
                        i // timestamp
                    );
                    expect(mockFailure.domainObject.useCapability.mostRecentCall.args[1]())
                        .toEqual({ id: mockFailure.id, modified: i });
                });
            });

            it("discards on request", function () {
                mockQ.all.andReturn(asPromise([]));
                handler.handle(mockFailures);
                // User chooses overwrite
                mockPromise.then.mostRecentCall.args[0](false);
                // Should refresh, but not remutate, and requeue all objects
                mockFailures.forEach(function (mockFailure, i) {
                    expect(mockFailure.persistence.refresh).toHaveBeenCalled();
                    expect(mockFailure.requeue).not.toHaveBeenCalled();
                    expect(mockFailure.domainObject.useCapability).not.toHaveBeenCalled();
                });
            });

        });
    }
);