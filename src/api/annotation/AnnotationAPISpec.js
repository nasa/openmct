import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe("The Annotation API", () => {
    let openmct;
    let mockObjectProvider;
    let mockDomainObject;
    let mockAnnotationObject;

    beforeEach(async () => {
        openmct = createOpenMct();
        const availableTags = openmct.annotation.getAvailableTags();
        mockDomainObject = {
            type: 'notebook',
            name: 'fooRabbitNotebook',
            identifier: {
                key: 'some-object',
                namespace: 'fooNameSpace'
            }
        };
        mockAnnotationObject = {
            type: 'annotation',
            name: 'Some Notebook Annotation',
            annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
            tags: [availableTags[0].id, availableTags[1].id],
            identifier: {
                key: 'anAnnotationKey',
                namespace: 'fooNameSpace'
            },
            targets: {
                mockDomainObject: {
                    entryId: 'fooBarEntry'
                }
            }
        };

        mockObjectProvider = jasmine.createSpyObj("mock provider", [
            "create",
            "update",
            "get"
        ]);
        // eslint-disable-next-line require-await
        mockObjectProvider.get = async (identifier) => {
            if (identifier.key === mockDomainObject.identifier.key) {
                return mockDomainObject;
            } else if (identifier.key === mockAnnotationObject.identifier.key) {
                return mockAnnotationObject;
            } else {
                return null;
            }
        };

        mockObjectProvider.create.and.returnValue(Promise.resolve(true));
        mockObjectProvider.update.and.returnValue(Promise.resolve(true));

        openmct.objects.addProvider('fooNameSpace', mockObjectProvider);
        openmct.startHeadless();
        await openmct.on('start');
        await openmct.objects.inMemorySearchProvider.index(mockDomainObject);
        await openmct.objects.inMemorySearchProvider.index(mockAnnotationObject);
    });
    afterEach(async () => {
        await resetApplicationState(openmct);
    });
    it("is defined", () => {
        expect(openmct.annotation).toBeDefined();
    });

    describe("Creation", () => {
        it("can create annotations", async () => {
            const annotationObject = await openmct.annotation.create('Test Annotation', mockDomainObject, openmct.annotation.ANNOTATION_TYPES.NOTEBOOK, ['sometag'], "fooContext", {'fooTarget': {}});
            console.debug(`annotationObject`, annotationObject);
            expect(annotationObject).toBeDefined();
            expect(annotationObject.type).toEqual('annotation');
        });
        it("fails if annotation is an unknown type", async () => {
            try {
                await openmct.annotation.create('Garbage Annotation', mockDomainObject, 'garbageAnnotation', ['sometag'], "fooContext", {'fooTarget': {}});
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe("Search", () => {
        it("can search for tags", async () => {
            console.trace();
            const results = await openmct.annotation.searchForTags('S');
            console.debug(`results`, results);
            expect(results).toBeDefined();
            expect(results.length).toEqual(1);
        });
    });
});
