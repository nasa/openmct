import { createOpenMct, resetApplicationState } from '../../utils/testing';
import CompositionCollection from './CompositionCollection';

describe('The Composition API', function () {
  let publicAPI;
  let compositionAPI;

  beforeEach(function (done) {
    publicAPI = createOpenMct();
    compositionAPI = publicAPI.composition;

    const mockObjectProvider = jasmine.createSpyObj('mock provider', ['create', 'update', 'get']);

    mockObjectProvider.create.and.returnValue(Promise.resolve(true));
    mockObjectProvider.update.and.returnValue(Promise.resolve(true));
    mockObjectProvider.get.and.callFake((identifier) => {
      return Promise.resolve({ identifier });
    });

    publicAPI.objects.addProvider('test', mockObjectProvider);
    publicAPI.objects.addProvider('custom', mockObjectProvider);

    publicAPI.on('start', done);
    publicAPI.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(publicAPI);
  });

  it('returns falsy if an object does not support composition', function () {
    expect(compositionAPI.get({})).toBeFalsy();
  });

  describe('default composition', function () {
    let domainObject;
    let composition;

    beforeEach(function () {
      domainObject = {
        name: 'test folder',
        identifier: {
          namespace: 'test',
          key: '1'
        },
        composition: [
          {
            namespace: 'test',
            key: 'a'
          },
          {
            namespace: 'test',
            key: 'b'
          },
          {
            namespace: 'test',
            key: 'c'
          }
        ]
      };
      composition = compositionAPI.get(domainObject);
    });

    it('returns composition collection', function () {
      expect(composition).toBeDefined();
      expect(composition).toEqual(jasmine.any(CompositionCollection));
    });

    it('correctly reflects composability', function () {
      expect(compositionAPI.supportsComposition(domainObject)).toBe(true);
      delete domainObject.composition;
      expect(compositionAPI.supportsComposition(domainObject)).toBe(false);
    });

    it('loads composition from domain object', function () {
      const listener = jasmine.createSpy('addListener');
      composition.on('add', listener);

      return composition.load().then(function () {
        expect(listener.calls.count()).toBe(3);
        expect(listener).toHaveBeenCalledWith({
          identifier: {
            namespace: 'test',
            key: 'a'
          }
        });
      });
    });
    describe('supports reordering of composition', function () {
      let listener;
      beforeEach(function () {
        listener = jasmine.createSpy('reorderListener');
        spyOn(publicAPI.objects, 'mutate');
        publicAPI.objects.mutate.and.callThrough();

        composition.on('reorder', listener);

        return composition.load();
      });
      it('', function () {
        composition.reorder(1, 0);
        let newComposition = publicAPI.objects.mutate.calls.mostRecent().args[2];
        let reorderPlan = listener.calls.mostRecent().args[0][0];

        expect(reorderPlan.oldIndex).toBe(1);
        expect(reorderPlan.newIndex).toBe(0);
        expect(newComposition[0].key).toEqual('b');
        expect(newComposition[1].key).toEqual('a');
        expect(newComposition[2].key).toEqual('c');
      });
      it('', function () {
        composition.reorder(0, 2);
        let newComposition = publicAPI.objects.mutate.calls.mostRecent().args[2];
        let reorderPlan = listener.calls.mostRecent().args[0][0];

        expect(reorderPlan.oldIndex).toBe(0);
        expect(reorderPlan.newIndex).toBe(2);
        expect(newComposition[0].key).toEqual('b');
        expect(newComposition[1].key).toEqual('c');
        expect(newComposition[2].key).toEqual('a');
      });
    });
    it('supports adding an object to composition', function () {
      let mockChildObject = {
        identifier: {
          key: 'mock-key',
          namespace: ''
        }
      };

      return new Promise((resolve) => {
        composition.on('add', resolve);
        composition.add(mockChildObject);
      }).then(() => {
        expect(domainObject.composition.length).toBe(4);
        expect(domainObject.composition[3]).toEqual(mockChildObject.identifier);
      });
    });
  });

  describe('static custom composition', function () {
    let customProvider;
    let domainObject;
    let composition;

    beforeEach(function () {
      // A simple custom provider, returns the same composition for
      // all objects of a given type.
      customProvider = {
        appliesTo: function (object) {
          return object.type === 'custom-object-type';
        },
        load: function (object) {
          return Promise.resolve([
            {
              namespace: 'custom',
              key: 'thing'
            }
          ]);
        },
        add: jasmine.createSpy('add'),
        remove: jasmine.createSpy('remove')
      };
      domainObject = {
        identifier: {
          namespace: 'test',
          key: '1'
        },
        type: 'custom-object-type'
      };
      compositionAPI.addProvider(customProvider);
      composition = compositionAPI.get(domainObject);
    });

    it('supports listening and loading', function () {
      const addListener = jasmine.createSpy('addListener');
      composition.on('add', addListener);

      return composition.load().then(function (children) {
        let listenObject;
        const loadedObject = children[0];

        expect(addListener).toHaveBeenCalled();

        listenObject = addListener.calls.mostRecent().args[0];
        expect(listenObject).toEqual(loadedObject);
        expect(loadedObject).toEqual({
          identifier: {
            namespace: 'custom',
            key: 'thing'
          }
        });
      });
    });
    describe('Calling add or remove', function () {
      let mockChildObject;

      beforeEach(function () {
        mockChildObject = {
          identifier: {
            key: 'mock-key',
            namespace: ''
          }
        };
        composition.add(mockChildObject);
      });

      it('calls add on the provider', function () {
        expect(customProvider.add).toHaveBeenCalledWith(domainObject, mockChildObject.identifier);
      });

      it('calls remove on the provider', function () {
        composition.remove(mockChildObject);
        expect(customProvider.remove).toHaveBeenCalledWith(
          domainObject,
          mockChildObject.identifier
        );
      });
    });
  });

  describe('dynamic custom composition', function () {
    let customProvider;
    let domainObject;
    let composition;

    beforeEach(function () {
      // A dynamic provider, loads an empty composition and exposes
      // listener functions.
      customProvider = jasmine.createSpyObj('dynamicProvider', ['appliesTo', 'load', 'on', 'off']);

      customProvider.appliesTo.and.returnValue('true');
      customProvider.load.and.returnValue(Promise.resolve([]));

      domainObject = {
        identifier: {
          namespace: 'test',
          key: '1'
        },
        type: 'custom-object-type'
      };
      compositionAPI.addProvider(customProvider);
      composition = compositionAPI.get(domainObject);
    });

    it('supports listening and loading', function () {
      const addListener = jasmine.createSpy('addListener');
      const removeListener = jasmine.createSpy('removeListener');
      const addPromise = new Promise(function (resolve) {
        addListener.and.callFake(resolve);
      });
      const removePromise = new Promise(function (resolve) {
        removeListener.and.callFake(resolve);
      });

      composition.on('add', addListener);
      composition.on('remove', removeListener);

      expect(customProvider.on).toHaveBeenCalledWith(
        domainObject,
        'add',
        jasmine.any(Function),
        jasmine.any(CompositionCollection)
      );
      expect(customProvider.on).toHaveBeenCalledWith(
        domainObject,
        'remove',
        jasmine.any(Function),
        jasmine.any(CompositionCollection)
      );
      const add = customProvider.on.calls.all()[0].args[2];
      const remove = customProvider.on.calls.all()[1].args[2];

      return composition
        .load()
        .then(function () {
          expect(addListener).not.toHaveBeenCalled();
          expect(removeListener).not.toHaveBeenCalled();
          add({
            namespace: 'custom',
            key: 'thing'
          });

          return addPromise;
        })
        .then(function () {
          expect(addListener).toHaveBeenCalledWith({
            identifier: {
              namespace: 'custom',
              key: 'thing'
            }
          });
          remove(addListener.calls.mostRecent().args[0]);

          return removePromise;
        })
        .then(function () {
          expect(removeListener).toHaveBeenCalledWith({
            identifier: {
              namespace: 'custom',
              key: 'thing'
            }
          });
        });
    });
  });
});
