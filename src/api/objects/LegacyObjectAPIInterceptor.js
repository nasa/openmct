define([
    './object-utils',
    './ObjectAPI',
    './objectEventEmitter'
], function (
    utils,
    ObjectAPI,
    objectEventEmitter
) {
    function ObjectServiceProvider(objectService, instantiate, topic) {
        this.objectService = objectService;
        this.instantiate = instantiate;

        this.generalTopic = topic('mutation');
        this.bridgeEventBuses();
    }

    /**
     * Bridges old and new style mutation events to provide compatibility between the two APIs
     * @private
     */
    ObjectServiceProvider.prototype.bridgeEventBuses = function () {
        var removeGeneralTopicListener;

        var handleMutation = function (newStyleObject) {
            var keyString = utils.makeKeyString(newStyleObject.key);
            var oldStyleObject = this.instantiate(utils.toOldFormat(newStyleObject), keyString);

            // Don't trigger self
            removeGeneralTopicListener();

            oldStyleObject.getCapability('mutation').mutate(function () {
                return utils.toOldFormat(newStyleObject);
            });

            removeGeneralTopicListener = this.generalTopic.listen(handleLegacyMutation);
        }.bind(this);

        var handleLegacyMutation = function (legacyObject){
            var newStyleObject = utils.toNewFormat(legacyObject.getModel(), legacyObject.getId());

            //Don't trigger self
            objectEventEmitter.off('mutation', handleMutation);
            objectEventEmitter.emit(newStyleObject.key.identifier + ":*", newStyleObject);
            objectEventEmitter.on('mutation', handleMutation);
        }.bind(this);

        objectEventEmitter.on('mutation', handleMutation);
        removeGeneralTopicListener = this.generalTopic.listen(handleLegacyMutation);
    };

    ObjectServiceProvider.prototype.save = function (object) {
        var key = object.key,
            keyString = utils.makeKeyString(key),
            newObject = this.instantiate(utils.toOldFormat(object), keyString);

        return object.getCapability('persistence')
                .persist()
                .then(function () {
                    return utils.toNewFormat(object, key);
                });
    };

    ObjectServiceProvider.prototype.delete = function (object) {
        // TODO!
    };

    ObjectServiceProvider.prototype.get = function (key) {
        var keyString = utils.makeKeyString(key);
        return this.objectService.getObjects([keyString])
            .then(function (results) {
                var model = results[keyString].getModel();
                return utils.toNewFormat(model, key);
            });
    };

    // Injects new object API as a decorator so that it hijacks all requests.
    // Object providers implemented on new API should just work, old API should just work, many things may break.
    function LegacyObjectAPIInterceptor(ROOTS, instantiate, topic, objectService) {
        this.getObjects = function (keys) {
            var results = {},
                promises = keys.map(function (keyString) {
                    var key = utils.parseKeyString(keyString);
                    return ObjectAPI.get(key)
                        .then(function (object) {
                            object = utils.toOldFormat(object)
                            results[keyString] = instantiate(object, keyString);
                        });
                });

            return Promise.all(promises)
                .then(function () {
                    return results;
                });
        };

        ObjectAPI._supersecretSetFallbackProvider(
            new ObjectServiceProvider(objectService, instantiate, topic)
        );

        ROOTS.forEach(function (r) {
            ObjectAPI.addRoot(utils.parseKeyString(r.id));
        });

        return this;
    }

    return LegacyObjectAPIInterceptor;
});
