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
                'get'
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
                
                return composition.load()
                    .then(function () {
                        loaded = true;
                    }).then(function () {
                    expect(listener.calls.count()).toBe(1);
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
                var listenPromise = new Promise(function (resolve) {
                    composition.on('add', resolve)
                });
                var loadPromise = composition.load();

                return Promise.all([listenPromise, loadPromise])
                    .then(function (objects) {
                        var listenObject = objects[0];
                        var loadedObject= objects[1][0];

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

            if ('supports loading', function () {
                return composition.load();
            })

            describe ('supports listen', function () {
                var add;
                var addListener;
                var addedObject;

                beforeEach(function (done) {
                    addedObject = {namespace: 'custom', key: 'thing'};
                    addListener = jasmine.createSpy('addListener');
                    addListener.and.callFake(done);
                    composition.on('add', addListener);

                    add = customProvider.on.calls.all()[0].args[2];
                    
                    add(addedObject);
                });

                it ('on add', function() {
                    expect(customProvider.on).toHaveBeenCalledWith(
                        domainObject,
                        'add',
                        jasmine.any(Function),
                        jasmine.any(CompositionCollection)
                    );
                    
                    expect(addListener).toHaveBeenCalledWith({
                        identifier: {namespace: 'custom', key: 'thing'}
                    });
                });

                it ('on remove', function(done) {
                    var removeListener = jasmine.createSpy('removeListener');
                    removeListener.and.callFake(done);

                    composition.on('remove', removeListener);
                    var remove = customProvider.on.calls.all()[1].args[2];

                    expect(customProvider.on).toHaveBeenCalledWith(
                        domainObject,
                        'remove',
                        jasmine.any(Function),
                        jasmine.any(CompositionCollection)
                    );
                    
                    remove(addListener.calls.mostRecent().args[0]);

                    expect(removeListener).toHaveBeenCalledWith({
                        identifier: {namespace: 'custom', key: 'thing'}
                    });
                });

            })
        });
    });
});
