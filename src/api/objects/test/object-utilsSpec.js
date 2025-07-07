import { makeKeyString, parseKeyString, toNewFormat, toOldFormat } from 'objectUtils';

describe('objectUtils', function () {
  describe('keyString util', function () {
    const EXPECTATIONS = {
      ROOT: {
        namespace: '',
        key: 'ROOT'
      },
      mine: {
        namespace: '',
        key: 'mine'
      },
      'extended:something:with:colons': {
        key: 'something:with:colons',
        namespace: 'extended'
      },
      'https\\://some/url:resourceId': {
        key: 'resourceId',
        namespace: 'https://some/url'
      },
      'scratch:root': {
        namespace: 'scratch',
        key: 'root'
      },
      'thingy\\:thing:abc123': {
        namespace: 'thingy:thing',
        key: 'abc123'
      }
    };

    Object.keys(EXPECTATIONS).forEach(function (keyString) {
      it('parses "' + keyString + '".', function () {
        expect(parseKeyString(keyString)).toEqual(EXPECTATIONS[keyString]);
      });

      it('parses and re-encodes "' + keyString + '"', function () {
        const identifier = parseKeyString(keyString);
        expect(makeKeyString(identifier)).toEqual(keyString);
      });

      it('is idempotent for "' + keyString + '".', function () {
        const identifier = parseKeyString(keyString);
        let again = parseKeyString(identifier);
        expect(identifier).toEqual(again);
        again = parseKeyString(again);
        again = parseKeyString(again);
        expect(identifier).toEqual(again);

        let againKeyString = makeKeyString(again);
        expect(againKeyString).toEqual(keyString);
        againKeyString = makeKeyString(againKeyString);
        againKeyString = makeKeyString(againKeyString);
        againKeyString = makeKeyString(againKeyString);
        expect(againKeyString).toEqual(keyString);
      });
    });
  });

  describe('old object conversions', function () {
    it('translate ids', function () {
      expect(
        toNewFormat(
          {
            prop: 'someValue'
          },
          'objId'
        )
      ).toEqual({
        prop: 'someValue',
        identifier: {
          namespace: '',
          key: 'objId'
        }
      });
    });

    it('translates composition', function () {
      expect(
        toNewFormat(
          {
            prop: 'someValue',
            composition: ['anotherObjectId', 'scratch:anotherObjectId']
          },
          'objId'
        )
      ).toEqual({
        prop: 'someValue',
        composition: [
          {
            namespace: '',
            key: 'anotherObjectId'
          },
          {
            namespace: 'scratch',
            key: 'anotherObjectId'
          }
        ],
        identifier: {
          namespace: '',
          key: 'objId'
        }
      });
    });
  });

  describe('new object conversions', function () {
    it('removes ids', function () {
      expect(
        toOldFormat({
          prop: 'someValue',
          identifier: {
            namespace: '',
            key: 'objId'
          }
        })
      ).toEqual({
        prop: 'someValue'
      });
    });

    it('translates composition', function () {
      expect(
        toOldFormat({
          prop: 'someValue',
          composition: [
            {
              namespace: '',
              key: 'anotherObjectId'
            },
            {
              namespace: 'scratch',
              key: 'anotherObjectId'
            }
          ],
          identifier: {
            namespace: '',
            key: 'objId'
          }
        })
      ).toEqual({
        prop: 'someValue',
        composition: ['anotherObjectId', 'scratch:anotherObjectId']
      });
    });
  });
});
