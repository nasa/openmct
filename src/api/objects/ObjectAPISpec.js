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
        let mockObjectProvider;
        let anotherMockObjectProvider;
        let mockFallbackProvider;
        let resultsGenerator;
        let fallbackProviderSearchResults;
        let promises;

        beforeEach(() => {
            jasmine.clock().install();

            fallbackProviderSearchResults = {
                hits: []
            };
            promises = [];

            mockObjectProvider = jasmine.createSpyObj("mock object provider", [
                "search"
            ]);
            anotherMockObjectProvider = jasmine.createSpyObj("another mock object provider", [
                "search"
            ]);
            mockFallbackProvider = jasmine.createSpyObj("super secret fallback provider", [
                "superSecretFallbackSearch"
            ]);
            objectAPI.addProvider('objects', mockObjectProvider);
            objectAPI.addProvider('other-objects', anotherMockObjectProvider);
            objectAPI.supersecretSetFallbackProvider(mockFallbackProvider);

            mockObjectProvider.search.and.callFake(() => delayedResolve(1000));
            anotherMockObjectProvider.search.and.callFake(() => delayedResolve(20000));
            mockFallbackProvider.superSecretFallbackSearch.and.callFake(() => delayedResolve(50, fallbackProviderSearchResults));

            resultsGenerator = objectAPI.search('foo');

            jasmine.clock().tick(30000);

            for (const results of resultsGenerator) {
                promises.push(results);
            }

            function delayedResolve(time, value) {
                return new Promise(resolve => setTimeout(() => resolve(value), time));
            }
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it("uses each objects given provider's search function", () => {
            expect(mockObjectProvider.search).toHaveBeenCalled();
            expect(anotherMockObjectProvider.search).toHaveBeenCalled();
        });

        it("uses the fallback indexed search for objects without a search function provided", () => {
            expect(mockFallbackProvider.superSecretFallbackSearch).toHaveBeenCalled();
        });

        it("provides a results generator so that consumers can process results from each provider immediately when available", () => {

        });
    });
});
