define([], function () {
    function TelemetryMeanActionDecorator (openmct, actionService) {
        this.actionService = actionService;
        this.openmct = openmct;

        [
            'decorateAction',
            'getActions',
            'updateTelemetryFromLinkedObject'
        ].forEach(function (name) {
            this[name] = this[name].bind(this);
        }.bind(this))
    }

    TelemetryMeanActionDecorator.prototype.decorateAction = function (action) {
        function update(object) {
            var domainObject = object || action.domainObject;
            return this.updateTelemetryFromLinkedObject(object)
            .then(function (modelWithTelemetry) {
                return this.mutate(domainObject, modelWithTelemetry);
            }.bind(this));
        }

        if (action.getMetadata && action.getMetadata().key === 'properties' || action.getMetadata().key === 'create'){
            var oldPerform = action.perform.bind(action);
            action.perform = function () {
                return oldPerform().then(update.bind(this), update.bind(this));
            }.bind(this);
        }
    }

    TelemetryMeanActionDecorator.prototype.mutate = function (domainObject, model) {
        return domainObject.useCapability('mutation', function () {
            return model
        });
    }

    TelemetryMeanActionDecorator.prototype.getActions = function () {
        var actions = this.actionService.getActions.apply(this.actionService, arguments);
        actions.forEach(this.decorateAction);
        return actions;      
    };

    TelemetryMeanActionDecorator.prototype.updateTelemetryFromLinkedObject = function (domainObject) {
        var model = domainObject.getModel();
        var telemetryPoint = model.telemetryPoint;
        var telemetryApi = this.openmct.telemetry;

        if (telemetryPoint) {
            return this.openmct.objects.get({ key: telemetryPoint}).then(function (referencedObject) {
                if (referencedObject.type !== 'unknown') {
                    var keysForRanges = telemetryApi.getMetadata(referencedObject).valuesForHints(['range'])
                        .map(function (metadatum) {
                            return metadatum.source;
                        });

                    model.telemetry.values = referencedObject.telemetry.values.map(function (value) {
                        if (keysForRanges.indexOf(value.source) !== -1) {
                            value.name = value.name + " (Mean)";
                        }
                        return value;
                    });
                }
                return model;
            }.bind(this));
        }
    }

    return TelemetryMeanActionDecorator;

});