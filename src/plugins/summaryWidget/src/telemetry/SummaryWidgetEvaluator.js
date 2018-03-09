define([
    './SummaryWidgetRule',
    '../eventHelpers',
    '../../../../api/objects/object-utils'
], function (
    SummaryWidgetRule,
    eventHelpers,
    objectUtils
) {

    function SummaryWidgetEvaluator(domainObject, openmct, callback) {
        this.openmct = openmct;
        this.telemetryState = {};
        this.callback = callback;
        this.loaded = false;
        this.destroyed = false;

        var composition = openmct.composition.get(domainObject);

        this.listenTo(composition, 'add', this.addChild, this);
        this.listenTo(composition, 'remove', this.removeChild, this);

        this.rules = domainObject.configuration.ruleOrder.map(function (ruleId) {
            return new SummaryWidgetRule(domainObject.configuration.ruleConfigById[ruleId]);
        });

        composition.load()
            .then(function () {
                this.loaded = true;
            }.bind(this));
    }

    eventHelpers.extend(SummaryWidgetEvaluator.prototype);

    SummaryWidgetEvaluator.prototype.addChild = function (childObject) {
        var childId = objectUtils.makeKeyString(childObject.identifier);
        var metadata = this.openmct.telemetry.getMetadata(childObject);
        var formats = this.openmct.telemetry.getFormatMap(metadata);
        var unsubscribe = this.openmct.telemetry.subscribe(
            childObject,
            this.updateDatum.bind(this, childId)
        );

        this.telemetryState[childId] = {
            domainObject: childObject,
            metadata: metadata,
            formats: formats,
            unsubscribe: unsubscribe,
            lastDatum: undefined,
            testDatum: undefined
        };
    };

    SummaryWidgetEvaluator.prototype.removeChild = function (childObject) {
        var childId = objectUtils.makeKeyString(childObject.identifier);
        var telemetrySource = this.telemetrySources[childId];
        delete this.telemetrySources[childId];
        telemetrySource.unsubscribe();
    };

    SummaryWidgetEvaluator.prototype.getTimestampedDatum = function (childId, datum) {
        var timestampedDatum = {};
        this.openmct.time.getAllTimeSystems().forEach(function (timeSystem) {
            timestampedDatum[timeSystem.key] =
                this.telemetryState[childId].formats[timeSystem.key].parse(datum);
        }, this);
        return timestampedDatum;
    };

    SummaryWidgetEvaluator.prototype.updateDatum = function (childId, datum) {
        var timestampedDatum = this.getTimestampedDatum(childId, datum);
        this.telemetryState[childId].lastDatum = datum;
        this.updateState(timestampedDatum);
    };

    SummaryWidgetEvaluator.prototype.addCallback = function (callback) {
        this.callbacks.push(callback);
    };

    SummaryWidgetEvaluator.prototype.updateStateFromRule = function (ruleIndex, newState) {
        var rule = this.rules[ruleIndex];

        newState.color = rule.color;
        newState.ruleName = rule.name;
        newState.ruleIndex = ruleIndex;
        newState.backgroundColor = rule.style['background-color'];
        newState.textColor = rule.style.color;
        newState.borderColor = rule.style['border-color'];
        newState.icon = rule.icon;

        this.callback(newState);
    };

    SummaryWidgetEvaluator.prototype.updateState = function (timestampedDatum) {
        for (var i = this.rules.length - 1; i > 0; i--) {
            if (this.rules[i].evaluate(this.telemetryState, false)) {
                break;
            }
        }
        this.updateStateFromRule(i, timestampedDatum);
    };

    SummaryWidgetEvaluator.prototype.destroy = function () {
        Object.keys(this.telemetryState).forEach(function (stateKey) {
            this.telemetryState[stateKey].unsubscribe();
        }, this);
        this.stopListening();
        this.destroyed = true;
        delete this.telemetryState;
        delete this.callback;
    };

    return SummaryWidgetEvaluator;

});
