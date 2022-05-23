import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe("The Annotation API", () => {
    let openmct;
    let mockObjectProvider;
    let mockDomainObject;
    let mockAnnotationObject;

    beforeEach((done) => {
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
                'fooNameSpace:some-object': {
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
        openmct.on('start', done);
        openmct.startHeadless();
    });
    afterEach(async () => {
        openmct.objects.providers = {};
        await resetApplicationState(openmct);
    });
    it("is defined", () => {
        expect(openmct.annotation).toBeDefined();
    });

    describe("Creation", () => {
        it("can create annotations", async () => {
            const annotationObject = await openmct.annotation.create('Test Annotation', mockDomainObject, openmct.annotation.ANNOTATION_TYPES.NOTEBOOK, ['sometag'], "fooContext", {'fooTarget': {}});
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
        let sharedWorkerToRestore;
        beforeEach(async () => {
            // use local worker
            sharedWorkerToRestore = openmct.objects.inMemorySearchProvider.worker;
            openmct.objects.inMemorySearchProvider.worker = null;
            await openmct.objects.inMemorySearchProvider.index(mockDomainObject);
            await openmct.objects.inMemorySearchProvider.index(mockAnnotationObject);
        });
        afterEach(() => {
            openmct.objects.inMemorySearchProvider.worker = sharedWorkerToRestore;
        });
        it("can search for tags", async () => {
            const results = await openmct.annotation.searchForTags('S');
            expect(results).toBeDefined();
            expect(results.length).toEqual(1);
        });
        it("can get for notebook annotation", async () => {
            const results = await openmct.annotation.getNotebookAnnotation('fooBarEntry', mockDomainObject);
            expect(results).toBeDefined();
            expect(results.tags.length).toEqual(2);
        });
    });
});
