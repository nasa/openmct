import ObjectAPI from './ObjectAPI.js';
import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe('The Object API', () => {
  let objectAPI;
  let typeRegistry;
  let openmct = {};
  let mockDomainObject;
  const TEST_NAMESPACE = 'test-namespace';
  const TEST_KEY = 'test-key';
  const USERNAME = 'Joan Q Public';
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  beforeEach((done) => {
    typeRegistry = jasmine.createSpyObj('typeRegistry', ['get']);
    const userProvider = {
      isLoggedIn() {
        return true;
      },
      getCurrentUser() {
        return Promise.resolve({
          getName() {
            return USERNAME;
          }
        });
      }
    };
    openmct = createOpenMct();
    openmct.user.setProvider(userProvider);
    objectAPI = openmct.objects;

    openmct.editor = {};
    openmct.editor.isEditing = () => false;

    mockDomainObject = {
      identifier: {
        namespace: TEST_NAMESPACE,
        key: TEST_KEY
      },
      name: 'test object',
      type: 'test-type'
    };
    openmct.on('start', () => {
      done();
    });
    openmct.startHeadless();
  });

  afterEach(async () => {
    await resetApplicationState(openmct);
  });

  describe('The save function', () => {
    it('Rejects if no provider available', async () => {
      let rejected = false;
      objectAPI.providers = {};
      objectAPI.fallbackProvider = null;

      try {
        await objectAPI.save(mockDomainObject);
      } catch (error) {
        rejected = true;
      }

      expect(rejected).toBe(true);
    });
    describe('when a provider is available', () => {
      let mockProvider;
      beforeEach(() => {
        mockProvider = jasmine.createSpyObj('mock provider', ['create', 'update']);
        mockProvider.create.and.returnValue(Promise.resolve(true));
        mockProvider.update.and.returnValue(Promise.resolve(true));
        objectAPI.addProvider(TEST_NAMESPACE, mockProvider);
      });
      it("Adds a 'created' timestamp to new objects", async () => {
        await objectAPI.save(mockDomainObject);
        expect(mockDomainObject.created).not.toBeUndefined();
      });
      it("Calls 'create' on provider if object is new", async () => {
        await objectAPI.save(mockDomainObject);
        expect(mockProvider.create).toHaveBeenCalled();
        expect(mockProvider.update).not.toHaveBeenCalled();
      });
      it("Calls 'update' on provider if object is not new", async () => {
        mockDomainObject.persisted = Date.now() - FIFTEEN_MINUTES;
        mockDomainObject.modified = Date.now();

        await objectAPI.save(mockDomainObject);
        expect(mockProvider.create).not.toHaveBeenCalled();
        expect(mockProvider.update).toHaveBeenCalled();
      });
      describe('the persisted timestamp for existing objects', () => {
        let persistedTimestamp;
        beforeEach(() => {
          persistedTimestamp = Date.now() - FIFTEEN_MINUTES;
          mockDomainObject.persisted = persistedTimestamp;
          mockDomainObject.modified = Date.now();
        });

        it('is updated', async () => {
          await objectAPI.save(mockDomainObject);
          expect(mockDomainObject.persisted).toBeDefined();
          expect(mockDomainObject.persisted > persistedTimestamp).toBe(true);
        });
        it('is >= modified timestamp', async () => {
          await objectAPI.save(mockDomainObject);
          expect(mockDomainObject.persisted >= mockDomainObject.modified).toBe(true);
        });
      });
      describe('the persisted timestamp for new objects', () => {
        it('is updated', async () => {
          await objectAPI.save(mockDomainObject);
          expect(mockDomainObject.persisted).toBeDefined();
        });
        it('is >= modified timestamp', async () => {
          await objectAPI.save(mockDomainObject);
          expect(mockDomainObject.persisted >= mockDomainObject.modified).toBe(true);
        });
      });

      it("Sets the current user for 'createdBy' on new objects", async () => {
        await objectAPI.save(mockDomainObject);
        expect(mockDomainObject.createdBy).toBe(USERNAME);
      });
      it("Sets the current user for 'modifedBy' on existing objects", async () => {
        mockDomainObject.persisted = Date.now() - FIFTEEN_MINUTES;
        mockDomainObject.modified = Date.now();

        await objectAPI.save(mockDomainObject);
        expect(mockDomainObject.modifiedBy).toBe(USERNAME);
      });

      it('Does not persist if the object is unchanged', () => {
        mockDomainObject.persisted = mockDomainObject.modified = Date.now();

        objectAPI.save(mockDomainObject);
        expect(mockProvider.create).not.toHaveBeenCalled();
        expect(mockProvider.update).not.toHaveBeenCalled();
      });

      describe('Shows a notification on persistence conflict', () => {
        beforeEach(() => {
          openmct.notifications.error = jasmine.createSpy('error');
        });

        it('on create', () => {
          mockProvider.create.and.returnValue(
            Promise.reject(new openmct.objects.errors.Conflict('Test Conflict error'))
          );

          return objectAPI.save(mockDomainObject).catch(() => {
            expect(openmct.notifications.error).toHaveBeenCalledWith(
              `Conflict detected while saving ${TEST_NAMESPACE}:${TEST_KEY}`
            );
          });
        });

        it('on update', () => {
          mockProvider.update.and.returnValue(
            Promise.reject(new openmct.objects.errors.Conflict('Test Conflict error'))
          );
          mockDomainObject.persisted = Date.now() - FIFTEEN_MINUTES;
          mockDomainObject.modified = Date.now();

          return objectAPI.save(mockDomainObject).catch(() => {
            expect(openmct.notifications.error).toHaveBeenCalledWith(
              `Conflict detected while saving ${TEST_NAMESPACE}:${TEST_KEY}`
            );
          });
        });
      });
    });
  });

  describe('The get function', () => {
    describe('when a provider is available', () => {
      let mockProvider;
      let mockInterceptor;
      let anotherMockInterceptor;
      let notApplicableMockInterceptor;
      beforeEach(() => {
        mockProvider = jasmine.createSpyObj('mock provider', ['get']);
        mockProvider.get.and.returnValue(Promise.resolve(mockDomainObject));

        mockInterceptor = jasmine.createSpyObj('mock interceptor', ['appliesTo', 'invoke']);
        mockInterceptor.appliesTo.and.returnValue(true);
        mockInterceptor.invoke.and.callFake((identifier, object) => {
          return Object.assign(
            {
              changed: true
            },
            object
          );
        });

        anotherMockInterceptor = jasmine.createSpyObj('another mock interceptor', [
          'appliesTo',
          'invoke'
        ]);
        anotherMockInterceptor.appliesTo.and.returnValue(true);
        anotherMockInterceptor.invoke.and.callFake((identifier, object) => {
          return Object.assign(
            {
              alsoChanged: true
            },
            object
          );
        });

        notApplicableMockInterceptor = jasmine.createSpyObj('not applicable mock interceptor', [
          'appliesTo',
          'invoke'
        ]);
        notApplicableMockInterceptor.appliesTo.and.returnValue(false);
        notApplicableMockInterceptor.invoke.and.callFake((identifier, object) => {
          return Object.assign(
            {
              shouldNotBeChanged: true
            },
            object
          );
        });
        objectAPI.addProvider(TEST_NAMESPACE, mockProvider);
        objectAPI.addGetInterceptor(mockInterceptor);
        objectAPI.addGetInterceptor(anotherMockInterceptor);
        objectAPI.addGetInterceptor(notApplicableMockInterceptor);
      });

      it('Caches multiple requests for the same object', () => {
        const promises = [];
        expect(mockProvider.get.calls.count()).toBe(0);
        promises.push(objectAPI.get(mockDomainObject.identifier));
        expect(mockProvider.get.calls.count()).toBe(1);
        promises.push(objectAPI.get(mockDomainObject.identifier));
        expect(mockProvider.get.calls.count()).toBe(1);

        return Promise.all(promises);
      });

      it('applies any applicable interceptors', () => {
        expect(mockDomainObject.changed).toBeUndefined();

        return objectAPI.get(mockDomainObject.identifier).then((object) => {
          expect(object.changed).toBeTrue();
          expect(object.alsoChanged).toBeTrue();
          expect(object.shouldNotBeChanged).toBeUndefined();
        });
      });

      it('displays a notification in the event of an error', () => {
        mockProvider.get.and.returnValue(Promise.reject());

        return objectAPI.get(mockDomainObject.identifier).catch(() => {
          expect(openmct.notifications.error).toHaveBeenCalledWith(
            `Failed to retrieve object ${TEST_NAMESPACE}:${TEST_KEY}`
          );
        });
      });
    });
  });

  describe('the mutation API', () => {
    let testObject;
    let updatedTestObject;
    let mutable;
    let mockProvider;
    let callbacks = [];

    beforeEach(function () {
      objectAPI = new ObjectAPI(typeRegistry, openmct);
      testObject = {
        identifier: {
          namespace: TEST_NAMESPACE,
          key: TEST_KEY
        },
        name: 'test object',
        type: 'notebook',
        otherAttribute: 'other-attribute-value',
        modified: 0,
        persisted: 0,
        objectAttribute: {
          embeddedObject: {
            embeddedKey: 'embedded-value'
          }
        }
      };
      updatedTestObject = Object.assign(
        {
          otherAttribute: 'changed-attribute-value'
        },
        testObject
      );
      updatedTestObject.modified = 1;
      updatedTestObject.persisted = 1;

      mockProvider = jasmine.createSpyObj('mock provider', [
        'get',
        'create',
        'update',
        'observe',
        'observeObjectChanges'
      ]);
      mockProvider.get.and.returnValue(Promise.resolve(testObject));
      mockProvider.create.and.returnValue(Promise.resolve(true));
      mockProvider.update.and.returnValue(Promise.resolve(true));
      mockProvider.observeObjectChanges.and.callFake(() => {
        callbacks[0](updatedTestObject);
        callbacks.splice(0, 1);

        return () => {};
      });
      mockProvider.observe.and.callFake((id, callback) => {
        if (callbacks.length === 0) {
          callbacks.push(callback);
        } else {
          callbacks[0] = callback;
        }

        return () => {};
      });

      objectAPI.addProvider(TEST_NAMESPACE, mockProvider);

      return objectAPI.getMutable(testObject.identifier).then((object) => {
        mutable = object;

        return mutable;
      });
    });

    afterEach(() => {
      mutable.$destroy();
    });

    it('mutates the original object', () => {
      const MUTATED_NAME = 'mutated name';
      objectAPI.mutate(testObject, 'name', MUTATED_NAME);
      expect(testObject.name).toBe(MUTATED_NAME);
    });

    it('Provides a way of refreshing an object from the persistence store', () => {
      const modifiedTestObject = JSON.parse(JSON.stringify(testObject));
      const OTHER_ATTRIBUTE_VALUE = 'Modified value';
      const NEW_ATTRIBUTE_VALUE = 'A new attribute';
      modifiedTestObject.otherAttribute = OTHER_ATTRIBUTE_VALUE;
      modifiedTestObject.newAttribute = NEW_ATTRIBUTE_VALUE;
      delete modifiedTestObject.objectAttribute;

      spyOn(objectAPI, 'get');
      objectAPI.get.and.returnValue(Promise.resolve(modifiedTestObject));

      expect(objectAPI.get).not.toHaveBeenCalled();

      return objectAPI.refresh(testObject).then(() => {
        expect(objectAPI.get).toHaveBeenCalledWith(testObject.identifier);

        expect(testObject.otherAttribute).toEqual(OTHER_ATTRIBUTE_VALUE);
        expect(testObject.newAttribute).toEqual(NEW_ATTRIBUTE_VALUE);
        expect(testObject.objectAttribute).not.toBeDefined();
      });
    });

    describe('uses a MutableDomainObject', () => {
      it('and retains properties of original object ', function () {
        expect(hasOwnProperty(mutable, 'identifier')).toBe(true);
        expect(hasOwnProperty(mutable, 'otherAttribute')).toBe(true);
        expect(mutable.identifier).toEqual(testObject.identifier);
        expect(mutable.otherAttribute).toEqual(testObject.otherAttribute);
      });

      it('that is identical to original object when serialized', function () {
        expect(JSON.stringify(mutable)).toEqual(JSON.stringify(testObject));
      });

      it('that observes for object changes', function () {
        let mockListener = jasmine.createSpy('mockListener');
        objectAPI.observe(testObject, '*', mockListener);
        mockProvider.observeObjectChanges();
        expect(mockListener).toHaveBeenCalled();
      });
    });

    describe('uses events', function () {
      let testObjectDuplicate;
      let mutableSecondInstance;

      beforeEach(function () {
        // Duplicate object to guarantee we are not sharing object instance, which would invalidate test
        testObjectDuplicate = JSON.parse(JSON.stringify(testObject));
        mutableSecondInstance = objectAPI.toMutable(testObjectDuplicate);
      });

      afterEach(() => {
        mutableSecondInstance.$destroy();
      });

      it('to stay synchronized when mutated', function () {
        objectAPI.mutate(mutable, 'otherAttribute', 'new-attribute-value');
        expect(mutableSecondInstance.otherAttribute).toBe('new-attribute-value');
      });

      it('to indicate when a property changes', function () {
        let mutationCallback = jasmine.createSpy('mutation-callback');
        let unlisten;

        return new Promise(function (resolve) {
          mutationCallback.and.callFake(resolve);
          unlisten = objectAPI.observe(mutableSecondInstance, 'otherAttribute', mutationCallback);
          objectAPI.mutate(mutable, 'otherAttribute', 'some-new-value');
        }).then(function () {
          expect(mutationCallback).toHaveBeenCalledWith('some-new-value', 'other-attribute-value');
          unlisten();
        });
      });

      it('to indicate when a child property has changed', function () {
        let embeddedKeyCallback = jasmine.createSpy('embeddedKeyCallback');
        let embeddedObjectCallback = jasmine.createSpy('embeddedObjectCallback');
        let objectAttributeCallback = jasmine.createSpy('objectAttribute');
        let listeners = [];

        return new Promise(function (resolve) {
          objectAttributeCallback.and.callFake(resolve);

          listeners.push(
            objectAPI.observe(
              mutableSecondInstance,
              'objectAttribute.embeddedObject.embeddedKey',
              embeddedKeyCallback
            )
          );
          listeners.push(
            objectAPI.observe(
              mutableSecondInstance,
              'objectAttribute.embeddedObject',
              embeddedObjectCallback
            )
          );
          listeners.push(
            objectAPI.observe(mutableSecondInstance, 'objectAttribute', objectAttributeCallback)
          );

          objectAPI.mutate(
            mutable,
            'objectAttribute.embeddedObject.embeddedKey',
            'updated-embedded-value'
          );
        }).then(function () {
          expect(embeddedKeyCallback).toHaveBeenCalledWith(
            'updated-embedded-value',
            'embedded-value'
          );
          expect(embeddedObjectCallback).toHaveBeenCalledWith(
            {
              embeddedKey: 'updated-embedded-value'
            },
            {
              embeddedKey: 'embedded-value'
            }
          );
          expect(objectAttributeCallback).toHaveBeenCalledWith(
            {
              embeddedObject: {
                embeddedKey: 'updated-embedded-value'
              }
            },
            {
              embeddedObject: {
                embeddedKey: 'embedded-value'
              }
            }
          );

          listeners.forEach((listener) => listener());
        });
      });
    });
  });

  describe('getOriginalPath', () => {
    let mockGrandParentObject;
    let mockParentObject;
    let mockChildObject;

    beforeEach(() => {
      const mockObjectProvider = jasmine.createSpyObj('mock object provider', [
        'create',
        'update',
        'get'
      ]);

      mockGrandParentObject = {
        type: 'folder',
        name: 'Grand Parent Folder',
        location: 'fooNameSpace:child',
        identifier: {
          key: 'grandParent',
          namespace: 'fooNameSpace'
        }
      };
      mockParentObject = {
        type: 'folder',
        name: 'Parent Folder',
        location: 'fooNameSpace:grandParent',
        identifier: {
          key: 'parent',
          namespace: 'fooNameSpace'
        }
      };
      mockChildObject = {
        type: 'folder',
        name: 'Child Folder',
        location: 'fooNameSpace:parent',
        identifier: {
          key: 'child',
          namespace: 'fooNameSpace'
        }
      };

      // eslint-disable-next-line require-await
      mockObjectProvider.get = async (identifier) => {
        if (identifier.key === mockGrandParentObject.identifier.key) {
          return mockGrandParentObject;
        } else if (identifier.key === mockParentObject.identifier.key) {
          return mockParentObject;
        } else if (identifier.key === mockChildObject.identifier.key) {
          return mockChildObject;
        } else {
          return null;
        }
      };

      openmct.objects.addProvider('fooNameSpace', mockObjectProvider);

      mockObjectProvider.create.and.returnValue(Promise.resolve(true));
      mockObjectProvider.update.and.returnValue(Promise.resolve(true));

      openmct.objects.addProvider('fooNameSpace', mockObjectProvider);
    });

    it('can construct paths even with cycles', async () => {
      const objectPath = await objectAPI.getOriginalPath(mockChildObject.identifier);
      expect(objectPath.length).toEqual(3);
    });
  });

  describe('transactions', () => {
    beforeEach(() => {
      spyOn(openmct.editor, 'isEditing').and.returnValue(true);
    });

    it('there is no active transaction', () => {
      expect(objectAPI.isTransactionActive()).toBe(false);
    });

    it('start a transaction', () => {
      objectAPI.startTransaction();
      expect(objectAPI.isTransactionActive()).toBe(true);
    });

    it('has active transaction', () => {
      objectAPI.startTransaction();
      const activeTransaction = objectAPI.getActiveTransaction();
      expect(activeTransaction).not.toBe(null);
    });

    it('end a transaction', () => {
      objectAPI.endTransaction();
      expect(objectAPI.isTransactionActive()).toBe(false);
    });

    it('returns dirty object on get', (done) => {
      spyOn(objectAPI, 'supportsMutation').and.returnValue(true);

      objectAPI.startTransaction();
      objectAPI.mutate(mockDomainObject, 'name', 'dirty object');

      const dirtyObject = objectAPI.transaction.getDirtyObject(mockDomainObject.identifier);

      objectAPI
        .get(mockDomainObject.identifier)
        .then((object) => {
          const areEqual = JSON.stringify(object) === JSON.stringify(dirtyObject);
          expect(areEqual).toBe(true);
        })
        .finally(done);
    });
  });
});

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}
