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
        const MOCK_PROVIDER_KEY = 'mockProvider';
        const ANOTHER_MOCK_PROVIDER_KEY = 'anotherMockProvider';
        const MOCK_PROVIDER_SEARCH_DELAY = 15000;
        const ANOTHER_MOCK_PROVIDER_SEARCH_DELAY = 20000;
        const TOTAL_TIME_ELAPSED = 21000;
        const BASE_TIME = new Date(2021, 0, 1);

        let mockObjectProvider;
        let anotherMockObjectProvider;
        let mockFallbackProvider;
        let resultsGenerator;
        let fallbackProviderSearchResults;
        let resultsPromises;

        beforeEach(() => {
            jasmine.clock().install();
            jasmine.clock().mockDate(BASE_TIME);

            resultsPromises = [];
            fallbackProviderSearchResults = {
                hits: []
            };

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

            mockObjectProvider.search.and.callFake(() => {
                return new Promise(resolve => {
                    const mockProviderSearch = {
                        name: MOCK_PROVIDER_KEY,
                        start: new Date()
                    };

                    setTimeout(() => {
                        mockProviderSearch.end = new Date();

                        return resolve(mockProviderSearch);
                    }, MOCK_PROVIDER_SEARCH_DELAY);
                });
            });
            anotherMockObjectProvider.search.and.callFake(() => {
                return new Promise(resolve => {
                    const anotherMockProviderSearch = {
                        name: ANOTHER_MOCK_PROVIDER_KEY,
                        start: new Date()
                    };

                    setTimeout(() => {
                        anotherMockProviderSearch.end = new Date();

                        return resolve(anotherMockProviderSearch);
                    }, ANOTHER_MOCK_PROVIDER_SEARCH_DELAY);
                });
            });
            mockFallbackProvider.superSecretFallbackSearch.and.callFake(
                () => new Promise(
                    resolve => setTimeout(
                        () => resolve(fallbackProviderSearchResults),
                        50
                    )
                )
            );

            resultsGenerator = objectAPI.search('foo');

            for (const resultsPromise of resultsGenerator) {
                resultsPromises.push(resultsPromise);
            }

            jasmine.clock().tick(TOTAL_TIME_ELAPSED);
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

        it("provides results as a generator so that consumers can process each providers results when returned", () => {
            expect(resultsGenerator.next).toBeDefined();
            expect(resultsGenerator.next().done).toBeTrue();
        });

        it("provides each providers results as promises that resolve in parallel", async () => {
            const results = await Promise.all(resultsPromises);
            const mockProviderResults = results.find(
                result => result.name === MOCK_PROVIDER_KEY
            );
            const anotherMockProviderResults = results.find(
                result => result.name === ANOTHER_MOCK_PROVIDER_KEY
            );
            const mockProviderStart = mockProviderResults.start.getTime();
            const mockProviderEnd = mockProviderResults.end.getTime();
            const anotherMockProviderStart = anotherMockProviderResults.start.getTime();
            const anotherMockProviderEnd = anotherMockProviderResults.end.getTime();
            const searchElapsedTime = Math.max(mockProviderEnd, anotherMockProviderEnd)
                - Math.min(mockProviderEnd, anotherMockProviderEnd);

            expect(mockProviderStart).toBeLessThan(anotherMockProviderEnd);
            expect(anotherMockProviderStart).toBeLessThan(mockProviderEnd);
            expect(searchElapsedTime).toBeLessThan(
                MOCK_PROVIDER_SEARCH_DELAY
                + ANOTHER_MOCK_PROVIDER_SEARCH_DELAY
            );
        });
    });
});
