define([], function () {
    function TelemetryMeanActionDecorator (actionService, $q) {
        this.actionService = actionService;
        this.$q = $q;

        [
            'decorateAction',
            'getActions',
            'updateTelemetryMetadata'
        ].forEach(function (name) {
            this[name] = this[name].bind(this);
        }.bind(this))
    }

    TelemetryMeanActionDecorator.prototype.decorateAction = function (action) {
        if (action.getMetadata && action.getMetadata().key === 'properties'){
            var oldPerform = action.perform.bind(action);
            action.perform = function () {
                oldPerform().then(function () {
                    var model = action.domainObject.getModel();
                    return this.updateTelemetryMetadata(model);
                }.bind(this));
            }.bind(this);
        }
    }

    TelemetryMeanActionDecorator.prototype.getActions = function () {
        var actions = this.actionService.getActions.apply(this.actionService, arguments);
        actions.forEach(this.decorateAction);
        return actions;      
    };

    TelemetryMeanActionDecorator.prototype.updateTelemetryMetadata = function (model) {
        var telemetryPoint = model.telemetryPoint;
        if (telemetryPoint) {
            return openmct.objects.get({ key: telemetryPoint}).then(function (referencedObject) {
                model.telemetry.values = referencedObject.telemetry.values.map(function (value) {
                    value.name = value.name + " (Mean)";
                    return value;
                });
                return model;
            });
        } else {
            model.telemetry = {
                values: []
            };
            return $q.when(model);
        }
    }

    return TelemetryMeanActionDecorator;

});