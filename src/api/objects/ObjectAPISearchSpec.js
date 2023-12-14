import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe('The Object API Search Function', () => {
  describe('The infrastructure', () => {
    const MOCK_PROVIDER_KEY = 'mockProvider';
    const ANOTHER_MOCK_PROVIDER_KEY = 'anotherMockProvider';
    const MOCK_PROVIDER_SEARCH_DELAY = 15000;
    const ANOTHER_MOCK_PROVIDER_SEARCH_DELAY = 20000;
    const TOTAL_TIME_ELAPSED = 21000;
    const BASE_TIME = new Date(2021, 0, 1);

    let mockObjectProvider;
    let anotherMockObjectProvider;
    let openmct;

    beforeEach((done) => {
      openmct = createOpenMct();

      mockObjectProvider = jasmine.createSpyObj('mock object provider', [
        'search',
        'supportsSearchType'
      ]);
      anotherMockObjectProvider = jasmine.createSpyObj('another mock object provider', [
        'search',
        'supportsSearchType'
      ]);
      openmct.objects.addProvider('objects', mockObjectProvider);
      openmct.objects.addProvider('other-objects', anotherMockObjectProvider);
      mockObjectProvider.supportsSearchType.and.callFake(() => {
        return true;
      });
      mockObjectProvider.search.and.callFake(() => {
        return new Promise((resolve) => {
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
      anotherMockObjectProvider.supportsSearchType.and.callFake(() => {
        return true;
      });
      anotherMockObjectProvider.search.and.callFake(() => {
        return new Promise((resolve) => {
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
      openmct.on('start', () => {
        done();
      });
      openmct.startHeadless();
    });
    afterEach(async () => {
      await resetApplicationState(openmct);
    });
    it("uses each objects given provider's search function", () => {
      openmct.objects.search('foo');
      expect(mockObjectProvider.search).toHaveBeenCalled();
    });
    it('provides each providers results as promises that resolve in parallel', async () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(BASE_TIME);
      const resultsPromises = openmct.objects.search('foo');
      jasmine.clock().tick(TOTAL_TIME_ELAPSED);
      const results = await Promise.all(resultsPromises);
      const mockProviderResults = results.find((result) => result.name === MOCK_PROVIDER_KEY);
      const anotherMockProviderResults = results.find(
        (result) => result.name === ANOTHER_MOCK_PROVIDER_KEY
      );
      const mockProviderStart = mockProviderResults.start.getTime();
      const mockProviderEnd = mockProviderResults.end.getTime();
      const anotherMockProviderStart = anotherMockProviderResults.start.getTime();
      const anotherMockProviderEnd = anotherMockProviderResults.end.getTime();
      const searchElapsedTime =
        Math.max(mockProviderEnd, anotherMockProviderEnd) -
        Math.min(mockProviderEnd, anotherMockProviderEnd);

      expect(mockProviderStart).toBeLessThan(anotherMockProviderEnd);
      expect(anotherMockProviderStart).toBeLessThan(mockProviderEnd);
      expect(searchElapsedTime).toBeLessThan(
        MOCK_PROVIDER_SEARCH_DELAY + ANOTHER_MOCK_PROVIDER_SEARCH_DELAY
      );

      jasmine.clock().uninstall();
    });
  });

  describe('The in-memory search indexer', () => {
    let openmct;
    let mockDomainObject1;
    let mockIdentifier1;
    let mockDomainObject2;
    let mockIdentifier2;
    let mockDomainObject3;
    let mockIdentifier3;

    beforeEach((done) => {
      openmct = createOpenMct();
      const defaultObjectProvider = openmct.objects.getProvider({
        key: '',
        namespace: ''
      });
      openmct.objects.addProvider('foo', defaultObjectProvider);
      spyOn(openmct.objects.inMemorySearchProvider, 'search').and.callThrough();
      spyOn(openmct.objects.inMemorySearchProvider, 'localSearchForObjects').and.callThrough();

      openmct.on('start', async () => {
        mockIdentifier1 = {
          key: 'some-object',
          namespace: 'foo'
        };
        mockDomainObject1 = {
          type: 'clock',
          name: 'fooRabbit',
          identifier: mockIdentifier1
        };
        mockIdentifier2 = {
          key: 'some-other-object',
          namespace: 'foo'
        };
        mockDomainObject2 = {
          type: 'clock',
          name: 'fooBear',
          identifier: mockIdentifier2
        };
        mockIdentifier3 = {
          key: 'yet-another-object',
          namespace: 'foo'
        };
        mockDomainObject3 = {
          type: 'clock',
          name: 'redBear',
          identifier: mockIdentifier3
        };
        await openmct.objects.inMemorySearchProvider.index(mockDomainObject1);
        await openmct.objects.inMemorySearchProvider.index(mockDomainObject2);
        await openmct.objects.inMemorySearchProvider.index(mockDomainObject3);
        done();
      });
      openmct.startHeadless();
    });

    afterEach(async () => {
      await resetApplicationState(openmct);
    });

    it('can provide indexing without a provider', () => {
      openmct.objects.search('foo');
      expect(openmct.objects.inMemorySearchProvider.search).toHaveBeenCalled();
    });

    it('can do partial search', async () => {
      const searchPromises = openmct.objects.search('foo');
      const searchResults = await Promise.all(searchPromises);
      expect(searchResults[0].length).toBe(2);
    });

    it('returns nothing when appropriate', async () => {
      const searchPromises = openmct.objects.search('laser');
      const searchResults = await Promise.all(searchPromises);
      expect(searchResults[0].length).toBe(0);
    });

    it('returns exact matches', async () => {
      const searchPromises = openmct.objects.search('redBear');
      const searchResults = await Promise.all(searchPromises);
      expect(searchResults[0].length).toBe(1);
    });

    describe('Without Shared Workers', () => {
      let sharedWorkerToRestore;
      beforeEach(async () => {
        // use local worker
        sharedWorkerToRestore = openmct.objects.inMemorySearchProvider.worker;
        openmct.objects.inMemorySearchProvider.worker = null;
        // reindex locally
        await openmct.objects.inMemorySearchProvider.index(mockDomainObject1);
        await openmct.objects.inMemorySearchProvider.index(mockDomainObject2);
        await openmct.objects.inMemorySearchProvider.index(mockDomainObject3);
      });
      afterEach(() => {
        openmct.objects.inMemorySearchProvider.worker = sharedWorkerToRestore;
      });
      it('calls local search', () => {
        openmct.objects.search('foo');
        expect(openmct.objects.inMemorySearchProvider.localSearchForObjects).toHaveBeenCalled();
      });

      it('can do partial search', async () => {
        const searchPromises = openmct.objects.search('foo');
        const searchResults = await Promise.all(searchPromises);
        expect(searchResults[0].length).toBe(2);
      });

      it('returns nothing when appropriate', async () => {
        const searchPromises = openmct.objects.search('laser');
        const searchResults = await Promise.all(searchPromises);
        expect(searchResults[0].length).toBe(0);
      });

      it('returns exact matches', async () => {
        const searchPromises = openmct.objects.search('redBear');
        const searchResults = await Promise.all(searchPromises);
        expect(searchResults[0].length).toBe(1);
      });
    });
  });
});
