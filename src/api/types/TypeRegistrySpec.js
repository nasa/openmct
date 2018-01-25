define(['./TypeRegistry', './Type'], function (TypeRegistry, Type) {
    describe('The Type API', function () {
        var typeregistry;

        beforeEach(function () {
            typeregistry = new TypeRegistry ();
            typeregistry.addType('testtype', {
                name: 'Test Type',
                description: 'This is a test type.',
                creatable: true
            });
        });
        it('new types are registered successfully', function () {
            expect(typeregistry.types.testtype.definition.name).toBe('Test Type');
        });

        it('type registry contains new keys', function () {
            expect(typeregistry.listKeys ()).toContain('testtype');
        });

        it('types can be retrieved', function () {
            expect(typeregistry.get('testtype').definition.description).toBe('This is a test type.');
        });

        it('types can be standardized', function () {
            var testtype = new Type({
                                        label: 'Test Type',
                                        description: 'This is a test type.',
                                        creatable: true
                                    });
            typeregistry.standardizeType(testtype);
            expect(testtype.label).toBeUndefined();
        });
    });
});
