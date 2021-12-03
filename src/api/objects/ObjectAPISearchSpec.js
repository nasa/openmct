import { createOpenMct, resetApplicationState } from '../../utils/testing';

fdescribe("The Object API Search Function", () => {
    const MOCK_PROVIDER_KEY = 'mockProvider';
    const ANOTHER_MOCK_PROVIDER_KEY = 'anotherMockProvider';
    const MOCK_PROVIDER_SEARCH_DELAY = 15000;
    const ANOTHER_MOCK_PROVIDER_SEARCH_DELAY = 20000;
    const TOTAL_TIME_ELAPSED = 21000;
    const BASE_TIME = new Date(2021, 0, 1);

    let objectAPI;
    let mockObjectProvider;
    let anotherMockObjectProvider;
    let resultsPromises;
    let openmct;

    beforeEach((done) => {
        jasmine.clock().install();
        jasmine.clock().mockDate(BASE_TIME);

        resultsPromises = [];
        openmct = createOpenMct();

        objectAPI = openmct.objects;

        mockObjectProvider = jasmine.createSpyObj("mock object provider", [
            "search"
        ]);
        anotherMockObjectProvider = jasmine.createSpyObj("another mock object provider", [
            "search"
        ]);
        objectAPI.addProvider('objects', mockObjectProvider);
        spyOn(objectAPI.inMemorySearchProvider, "query").and.callThrough();

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

        openmct.on('start', done);
        openmct.startHeadless();


        jasmine.clock().tick(TOTAL_TIME_ELAPSED);
    });

    afterEach(async () => {
        jasmine.clock().uninstall();
        await resetApplicationState(openmct);
    });

    it("uses each objects given provider's search function", () => {
        resultsPromises = objectAPI.search('foo');
        expect(mockObjectProvider.search).toHaveBeenCalled();
    });

    it("uses the in-memory indexed search for objects without a search function provided", () => {
        resultsPromises = objectAPI.search('foo');
        expect(objectAPI.inMemorySearchProvider.query).toHaveBeenCalled();
    });

    it("provides each providers results as promises that resolve in parallel", async () => {
        resultsPromises = objectAPI.search('foo');
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
