define(['../src/ConditionManager'], function (ConditionManager) {
    describe('A Summary Widget Condition Manager', function () {
        var conditionManager,
            mockDomainObject,
            mockComposition,
            mockOpenMCT,
            mockTelemetryAPI;

        beforeEach(function () {
            mockDomainObject = {
                identifier: {
                    key: 'testKey'
                },
                name: 'testName',
                composition: [],
                configuration: {}
            };
            mockComposition = jasmine.createSpyObj('composition', [
                'on',
                'load'
            ]);
            mockTelemetryAPI = jasmine.createSpyObj('telemtryAPI', [
                'request',
                'canProvideTelemetry',
                'getMetadata',
                'subscribe'
            ]);
            mockOpenMCT = jasmine.createSpyObj('openmct', [
                'telemetry',
                'composition'
            ]);
            mockOpenMCT.composition.get = jasmine.createSpy('get').andReturn(mockComposition);

            conditionManager = new ConditionManager(mockDomainObject, mockOpenMCT);
        });

        it('', function () {

        });
    });
});
