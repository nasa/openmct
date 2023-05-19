import { createOpenMct, resetApplicationState } from '../utils/testing';
import { paramsToArray, identifierToString, default as objectPathToUrl } from './url';

describe('the url tool', function () {
  let openmct;
  let mockObjectPath;

  beforeEach((done) => {
    mockObjectPath = [
      {
        name: 'mock folder',
        type: 'fake-folder',
        identifier: {
          key: 'mock-folder',
          namespace: ''
        }
      },
      {
        name: 'mock parent folder',
        type: 'fake-folder',
        identifier: {
          key: 'mock-parent-folder',
          namespace: ''
        }
      }
    ];
    openmct = createOpenMct();
    openmct.on('start', () => {
      openmct.router.setPath('/browse/mine?testParam1=testValue1');
      done();
    });
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('paramsToArray', () => {
    it('exists', () => {
      expect(paramsToArray).toBeDefined();
    });
    it('can construct an array properly from query parameters', () => {
      const arrayOfParams = paramsToArray(openmct);
      expect(arrayOfParams.length).toBeDefined();
      expect(arrayOfParams.length).toBeGreaterThan(0);
    });
  });

  describe('identifierToString', () => {
    it('exists', () => {
      expect(identifierToString).toBeDefined();
    });
    it('can construct a String properly from a path', () => {
      const constructedString = identifierToString(openmct, mockObjectPath);
      expect(constructedString).toEqual('#/browse/mock-parent-folder/mock-folder');
    });
  });

  describe('objectPathToUrl', () => {
    it('exists', () => {
      expect(objectPathToUrl).toBeDefined();
    });
    it('can construct URL properly from a path', () => {
      const constructedURL = objectPathToUrl(openmct, mockObjectPath);
      expect(constructedURL).toContain('#/browse/mock-parent-folder/mock-folder');
    });
    it('can take params to set a custom url', () => {
      const customParams = {
        'tc.startBound': 1669911059,
        'tc.endBound': 1669911082,
        'tc.mode': 'fixed'
      };
      const constructedURL = objectPathToUrl(openmct, mockObjectPath, customParams);
      expect(constructedURL).toContain(
        'tc.startBound=1669911059&tc.endBound=1669911082&tc.mode=fixed'
      );
    });
  });
});
