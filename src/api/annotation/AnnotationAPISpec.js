import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe("The Annotation API", () => {
    let openmct;
    let mockObjectProvider;
    let mockDomainObject;

    beforeEach((done) => {
        openmct = createOpenMct();
        mockDomainObject = {
            type: 'notebook',
            name: 'fooRabbitNotebook',
            identifier: {
                key: 'some-object',
                namespace: 'fooNameSpace'
            }
        };

        mockObjectProvider = jasmine.createSpyObj("mock provider", [
            "create",
            "update",
            "get"
        ]);
        // eslint-disable-next-line require-await
        mockObjectProvider.get = async () => {
            return mockDomainObject;
        };

        mockObjectProvider.create.and.returnValue(Promise.resolve(true));
        mockObjectProvider.update.and.returnValue(Promise.resolve(true));

        openmct.objects.addProvider('fooNameSpace', mockObjectProvider);
        openmct.on('start', () => {
            done();
        });
        openmct.startHeadless();
    });
    afterEach(async () => {
        await resetApplicationState(openmct);
    });
    it("is defined", () => {
        expect(openmct.annotation).toBeDefined();
    });

    describe("Creation", () => {
        it("can create annotations", async () => {
            console.trace();
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
});
