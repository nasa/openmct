import ObjectAPI from './ObjectAPI.js';

fdescribe("The Object API", () => {
    let objectAPI;
    let mockDomainObject;
    const TEST_NAMESPACE = "test-namespace";
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    beforeEach(() => {
        objectAPI = new ObjectAPI();
        mockDomainObject = {
            identifier: {
                namespace: TEST_NAMESPACE,
                key: "test-key"
            },
            name: "test object",
            type: "test-type"
        };
    });
    describe("The save function", () => {
        it("Rejects if no provider available", () => {
            let rejected = false;

            return objectAPI.save(mockDomainObject)
                .catch(() => rejected = true)
                .then(() => expect(rejected).toBe(true));
        });
        describe("when a provider is available", () => {
            let mockProvider;
            beforeEach(() => {
                mockProvider = jasmine.createSpyObj("mock provider", [
                    "create",
                    "update"
                ]);
                mockProvider.create.and.returnValue(Promise.resolve(true));
                objectAPI.addProvider(TEST_NAMESPACE, mockProvider);
            });
            it("Calls 'create' on provider if object is new", () => {
                objectAPI.save(mockDomainObject);
                expect(mockProvider.create).toHaveBeenCalled();
                expect(mockProvider.update).not.toHaveBeenCalled();
            });
            it("Calls 'update' on provider if object is not new", () => {
                mockDomainObject.persisted = Date.now() - FIFTEEN_MINUTES;
                mockDomainObject.modified = Date.now();

                objectAPI.save(mockDomainObject);
                expect(mockProvider.create).not.toHaveBeenCalled();
                expect(mockProvider.update).toHaveBeenCalled();
            });

            it("Does not persist if the object is unchanged", () => {
                mockDomainObject.persisted =
                    mockDomainObject.modified = Date.now();

                objectAPI.save(mockDomainObject);
                expect(mockProvider.create).not.toHaveBeenCalled();
                expect(mockProvider.update).not.toHaveBeenCalled();
            });
        });
    });

    describe("The get function", () => {
        describe("when a provider is available", () => {
            let mockProvider;
            let mockInterceptor;
            let anotherMockInterceptor;
            let notApplicableMockInterceptor;
            beforeEach(() => {
                mockProvider = jasmine.createSpyObj("mock provider", [
                    "get"
                ]);
                mockProvider.get.and.returnValue(Promise.resolve(mockDomainObject));

                mockInterceptor = jasmine.createSpyObj("mock interceptor", [
                    "appliesTo",
                    "invoke"
                ]);
                mockInterceptor.appliesTo.and.returnValue(true);
                mockInterceptor.invoke.and.callFake((identifier, object) => {
                    return Object.assign({
                        changed: true
                    }, object);
                });

                anotherMockInterceptor = jasmine.createSpyObj("another mock interceptor", [
                    "appliesTo",
                    "invoke"
                ]);
                anotherMockInterceptor.appliesTo.and.returnValue(true);
                anotherMockInterceptor.invoke.and.callFake((identifier, object) => {
                    return Object.assign({
                        alsoChanged: true
                    }, object);
                });

                notApplicableMockInterceptor = jasmine.createSpyObj("not applicable mock interceptor", [
                    "appliesTo",
                    "invoke"
                ]);
                notApplicableMockInterceptor.appliesTo.and.returnValue(false);
                notApplicableMockInterceptor.invoke.and.callFake((identifier, object) => {
                    return Object.assign({
                        shouldNotBeChanged: true
                    }, object);
                });
                objectAPI.addProvider(TEST_NAMESPACE, mockProvider);
                objectAPI.addGetInterceptor(mockInterceptor);
                objectAPI.addGetInterceptor(anotherMockInterceptor);
                objectAPI.addGetInterceptor(notApplicableMockInterceptor);
            });

            it("Caches multiple requests for the same object", () => {
                expect(mockProvider.get.calls.count()).toBe(0);
                objectAPI.get(mockDomainObject.identifier);
                expect(mockProvider.get.calls.count()).toBe(1);
                objectAPI.get(mockDomainObject.identifier);
                expect(mockProvider.get.calls.count()).toBe(1);
            });

            it("applies any applicable interceptors", () => {
                expect(mockDomainObject.changed).toBeUndefined();
                objectAPI.get(mockDomainObject.identifier).then((object) => {
                    expect(object.changed).toBeTrue();
                    expect(object.alsoChanged).toBeTrue();
                    expect(object.shouldNotBeChanged).toBeUndefined();
                });
            });
        });
    });

    describe("the search function", () => {
        it("uses each objects given provider's search function", () => {
            const myMockProvider = jasmine.createSpyObj("mock provider", [
                "search"
            ]);
            const myOtherMockProvider = jasmine.createSpyObj("another mock provider", [
                "search"
            ]);
            const fallbackProvider = jasmine.createSpyObj("super secret fallback provider", [
                "superSecretFallbackSearch"
            ]);

            myMockProvider.search.and.callFake(() => Promise.resolve(true));
            myOtherMockProvider.search.and.callFake(() => Promise.resolve(true));
            fallbackProvider.superSecretFallbackSearch.and.callFake(() => Promise.resolve(true));

            objectAPI.addProvider('objects', myMockProvider);
            objectAPI.addProvider('other-objects', myOtherMockProvider);
            objectAPI.supersecretSetFallbackProvider(fallbackProvider);

            const resultsGenerator = objectAPI.search('foo');
            let nextResults = resultsGenerator.next();

            while (!nextResults.done) {
                nextResults = resultsGenerator.next();
            }

            expect(myMockProvider.search).toHaveBeenCalled();
            expect(myOtherMockProvider.search).toHaveBeenCalled();
            expect(fallbackProvider.superSecretFallbackSearch).toHaveBeenCalled();
        });

        it("uses the fallback indexed search for objects without a search function provided", () => {

        });

        it("provides a results generator so that consumers can process results from each provider immediately when available", () => {

        });
    });
});
