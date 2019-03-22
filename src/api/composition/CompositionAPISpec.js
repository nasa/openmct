define([
    './CompositionAPI',
    './CompositionCollection'
], function (
    CompositionAPI,
    CompositionCollection
) {

    describe('The Composition API', function () {
        var publicAPI;
        var compositionAPI;
        var topicService;
        var mutationTopic;

        beforeEach(function () {

            mutationTopic = jasmine.createSpyObj('mutationTopic', [
                'listen'
            ]);
            topicService = jasmine.createSpy('topicService');
            topicService.and.returnValue(mutationTopic);
            publicAPI = {};
            publicAPI.objects = jasmine.createSpyObj('ObjectAPI', [
                'get',
                'mutate'
            ]);
            publicAPI.objects.eventEmitter = jasmine.createSpyObj('eventemitter', [
                'on'
            ]);
            publicAPI.objects.get.and.callFake(function (identifier) {
                return Promise.resolve({identifier: identifier});
            });
            publicAPI.$injector = jasmine.createSpyObj('$injector', [
                'get'
            ]);
            publicAPI.$injector.get.and.returnValue(topicService);
            compositionAPI = new CompositionAPI(publicAPI);
        });

        it('returns falsy if an object does not support composition', function () {
            expect(compositionAPI.get({})).toBeFalsy();
        });

        describe('default composition', function () {
            var domainObject;
            var composition;

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

            it('loads composition from domain object', function () {
                var listener = jasmine.createSpy('addListener');
                composition.on('add', listener);

                return composition.load().then(function () {
                    expect(listener.calls.count()).toBe(3);
                    expect(listener).toHaveBeenCalledWith({
                        identifier: {namespace: 'test', key: 'a'}
                    });
                });
            });
            describe('supports reordering of composition', function () {
                var listener;
                beforeEach(function () {
                    listener = jasmine.createSpy('reorderListener');
                    composition.on('reorder', listener);
                    
                    return composition.load();
                });
                it('', function () {
                    composition.reorder(1, 0);
                    let newComposition =
                        publicAPI.objects.mutate.calls.mostRecent().args[2];
                    let reorderPlan = listener.calls.mostRecent().args[0][0];

                    expect(reorderPlan.oldIndex).toBe(1);
                    expect(reorderPlan.newIndex).toBe(0);
                    expect(newComposition[0].key).toEqual('b');
                    expect(newComposition[1].key).toEqual('a');
                    expect(newComposition[2].key).toEqual('c');
                });
                it('', function () {
                    composition.reorder(0, 2);
                    let newComposition =
                        publicAPI.objects.mutate.calls.mostRecent().args[2];
                    let reorderPlan = listener.calls.mostRecent().args[0][0];

                    expect(reorderPlan.oldIndex).toBe(0);
                    expect(reorderPlan.newIndex).toBe(2);
                    expect(newComposition[0].key).toEqual('b');
                    expect(newComposition[1].key).toEqual('c');
                    expect(newComposition[2].key).toEqual('a');
                })
            });

            // TODO: Implement add/removal in new default provider.
            xit('synchronizes changes between instances', function () {
                var otherComposition = compositionAPI.get(domainObject);
                var addListener = jasmine.createSpy('addListener');
                var removeListener = jasmine.createSpy('removeListener');
                var otherAddListener = jasmine.createSpy('otherAddListener');
                var otherRemoveListener = jasmine.createSpy('otherRemoveListener');
                composition.on('add', addListener);
                composition.on('remove', removeListener);
                otherComposition.on('add', otherAddListener);
                otherComposition.on('remove', otherRemoveListener);

                return Promise.all([composition.load(), otherComposition.load()])
                    .then(function () {
                        expect(addListener).toHaveBeenCalled();
                        expect(otherAddListener).toHaveBeenCalled();
                        expect(removeListener).not.toHaveBeenCalled();
                        expect(otherRemoveListener).not.toHaveBeenCalled();

                        var object = addListener.calls.mostRecent().args[0];
                        composition.remove(object);
                        expect(removeListener).toHaveBeenCalled();
                        expect(otherRemoveListener).toHaveBeenCalled();

                        addListener.reset();
                        otherAddListener.reset();
                        composition.add(object);
                        expect(addListener).toHaveBeenCalled();
                        expect(otherAddListener).toHaveBeenCalled();

                        removeListener.reset();
                        otherRemoveListener.reset();
                        otherComposition.remove(object);
                        expect(removeListener).toHaveBeenCalled();
                        expect(otherRemoveListener).toHaveBeenCalled();

                        addListener.reset();
                        otherAddListener.reset();
                        otherComposition.add(object);
                        expect(addListener).toHaveBeenCalled();
                        expect(otherAddListener).toHaveBeenCalled();
                    });
            });
        });

        describe('static custom composition', function () {
            var customProvider;
            var domainObject;
            var composition;

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
                    }
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
                var addListener = jasmine.createSpy('addListener');
                composition.on('add', addListener);

                return composition.load().then(function (children) {
                    var listenObject;
                    var loadedObject = children[0];

                    expect(addListener).toHaveBeenCalled();

                    listenObject = addListener.calls.mostRecent().args[0];
                    expect(listenObject).toEqual(loadedObject);
                    expect(loadedObject).toEqual({
                        identifier: {namespace: 'custom', key: 'thing'}
                    });
                });
            });
        });

        describe('dynamic custom composition', function () {
            var customProvider;
            var domainObject;
            var composition;

            beforeEach(function () {
                // A dynamic provider, loads an empty composition and exposes
                // listener functions.
                customProvider = jasmine.createSpyObj('dynamicProvider', [
                    'appliesTo',
                    'load',
                    'on',
                    'off'
                ]);

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
                var addListener = jasmine.createSpy('addListener');
                var removeListener = jasmine.createSpy('removeListener');
                var addPromise = new Promise(function (resolve) {
                    addListener.and.callFake(resolve);
                });
                var removePromise = new Promise(function (resolve) {
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
                var add = customProvider.on.calls.all()[0].args[2];
                var remove = customProvider.on.calls.all()[1].args[2];

                return composition.load()
                    .then(function () {
                        expect(addListener).not.toHaveBeenCalled();
                        expect(removeListener).not.toHaveBeenCalled();
                        add({namespace: 'custom', key: 'thing'});
                        return addPromise;
                    }).then(function () {
                        expect(addListener).toHaveBeenCalledWith({
                            identifier: {namespace: 'custom', key: 'thing'}
                        });
                        remove(addListener.calls.mostRecent().args[0]);
                        return removePromise;
                    }).then(function () {
                        expect(removeListener).toHaveBeenCalledWith({
                            identifier: {namespace: 'custom', key: 'thing'}
                        });
                    });
            });
        });
    });
});
