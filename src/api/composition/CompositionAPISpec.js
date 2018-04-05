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
            topicService.andReturn(mutationTopic);
            publicAPI = {};
            publicAPI.objects = jasmine.createSpyObj('ObjectAPI', [
                'get'
            ]);
            publicAPI.objects.get.andCallFake(function (identifier) {
                return Promise.resolve({identifier: identifier});
            });
            publicAPI.$injector = jasmine.createSpyObj('$injector', [
                'get'
            ]);
            publicAPI.$injector.get.andReturn(topicService);
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
                var loaded = false;
                composition.on('add', listener);
                composition.load()
                    .then(function () {
                        loaded = true;
                    });
                waitsFor(function () {
                    return loaded;
                });
                runs(function () {
                    expect(listener.calls.length).toBe(1);
                    expect(listener).toHaveBeenCalledWith({
                        identifier: {namespace: 'test', key: 'a'}
                    });
                });
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
                var loaded = false;
                Promise.all([composition.load(), otherComposition.load()])
                    .then(function () {
                        loaded = true;
                    });
                waitsFor(function () {
                    return loaded;
                });
                runs(function () {
                    expect(addListener).toHaveBeenCalled();
                    expect(otherAddListener).toHaveBeenCalled();
                    expect(removeListener).not.toHaveBeenCalled();
                    expect(otherRemoveListener).not.toHaveBeenCalled();

                    var object = addListener.mostRecentCall.args[0];
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
                var listener = jasmine.createSpy('addListener');
                var loaded = false;
                composition.on('add', listener);
                composition.load()
                    .then(function () {
                        loaded = true;
                    });
                waitsFor(function () {
                    return loaded;
                });
                runs(function () {
                    expect(listener.calls.length).toBe(1);
                    expect(listener).toHaveBeenCalledWith({
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

                customProvider.appliesTo.andReturn('true');
                customProvider.load.andReturn(Promise.resolve([]));

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
                var loaded = false;
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
                var add = customProvider.on.calls[0].args[2];
                var remove = customProvider.on.calls[1].args[2];
                composition.load()
                    .then(function () {
                        loaded = true;
                    });
                waitsFor(function () {
                    return loaded;
                });
                runs(function () {
                    expect(addListener).not.toHaveBeenCalled();
                    expect(removeListener).not.toHaveBeenCalled();
                    add({namespace: 'custom', key: 'thing'});
                });
                waitsFor(function () {
                    return addListener.calls.length > 0;
                });
                runs(function () {
                    expect(addListener).toHaveBeenCalledWith({
                        identifier: {namespace: 'custom', key: 'thing'}
                    });
                    remove(addListener.mostRecentCall.args[0]);
                });
                waitsFor(function () {
                    return removeListener.calls.length > 0;
                });
                runs(function () {
                    expect(removeListener).toHaveBeenCalledWith({
                        identifier: {namespace: 'custom', key: 'thing'}
                    });
                });
            });
        });
    });
});
