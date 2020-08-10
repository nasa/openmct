define([
    './StaticModelProvider',
    './static-provider-test.json'
], function (
    StaticModelProvider,
    testStaticData
) {

    describe('StaticModelProvider', function () {

        let staticProvider;

        beforeEach(function () {
            const staticData = JSON.parse(JSON.stringify(testStaticData));
            staticProvider = new StaticModelProvider(staticData, {
                namespace: 'my-import',
                key: 'root'
            });
        });

        describe('rootObject', function () {
            let rootModel;

            beforeEach(function () {
                rootModel = staticProvider.get({
                    namespace: 'my-import',
                    key: 'root'
                });
            });

            it('is located at top level', function () {
                expect(rootModel.location).toBe('ROOT');
            });

            it('has new-format identifier', function () {
                expect(rootModel.identifier).toEqual({
                    namespace: 'my-import',
                    key: 'root'
                });
            });

            it('has new-format composition', function () {
                expect(rootModel.composition).toContain({
                    namespace: 'my-import',
                    key: '1'
                });
                expect(rootModel.composition).toContain({
                    namespace: 'my-import',
                    key: '2'
                });
            });
        });

        describe('childObjects', function () {
            let swg;
            let layout;
            let fixed;

            beforeEach(function () {
                swg = staticProvider.get({
                    namespace: 'my-import',
                    key: '1'
                });
                layout = staticProvider.get({
                    namespace: 'my-import',
                    key: '2'
                });
                fixed = staticProvider.get({
                    namespace: 'my-import',
                    key: '3'
                });
            });

            it('match expected ordering', function () {
                // this is a sanity check to make sure the identifiers map in
                // the correct order.
                expect(swg.type).toBe('generator');
                expect(layout.type).toBe('layout');
                expect(fixed.type).toBe('telemetry.fixed');
            });

            it('have new-style identifiers', function () {
                expect(swg.identifier).toEqual({
                    namespace: 'my-import',
                    key: '1'
                });
                expect(layout.identifier).toEqual({
                    namespace: 'my-import',
                    key: '2'
                });
                expect(fixed.identifier).toEqual({
                    namespace: 'my-import',
                    key: '3'
                });
            });

            it('have new-style composition', function () {
                expect(layout.composition).toContain({
                    namespace: 'my-import',
                    key: '1'
                });
                expect(layout.composition).toContain({
                    namespace: 'my-import',
                    key: '3'
                });
                expect(fixed.composition).toContain({
                    namespace: 'my-import',
                    key: '1'
                });
            });

            it('rewrites locations', function () {
                expect(swg.location).toBe('my-import:root');
                expect(layout.location).toBe('my-import:root');
                expect(fixed.location).toBe('my-import:2');
            });

            it('rewrites matched identifiers in objects', function () {
                expect(layout.configuration.layout.panels['my-import:1'])
                    .toBeDefined();
                expect(layout.configuration.layout.panels['my-import:3'])
                    .toBeDefined();
                expect(layout.configuration.layout.panels['483c00d4-bb1d-4b42-b29a-c58e06b322a0'])
                    .not.toBeDefined();
                expect(layout.configuration.layout.panels['20273193-f069-49e9-b4f7-b97a87ed755d'])
                    .not.toBeDefined();
                expect(fixed.configuration['fixed-display'].elements[0].id)
                    .toBe('my-import:1');
            });

        });
    });
});
