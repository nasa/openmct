define([
    './operations'
], function (
    OPERATIONS
) {

    function SummaryWidgetCondition(definition) {
        this.object = definition.object;
        this.key = definition.key;
        this.values = definition.values;
        if (!definition.operation) {
            // TODO: better handling for default rule.
            this.evaluate = function () {
                return true;
            };
        } else {
            this.comparator = OPERATIONS[definition.operation].operation;
        }
    }

    SummaryWidgetCondition.prototype.evaluate = function (telemetryState) {
        var stateKeys = Object.keys(telemetryState);
        var state;
        var result;
        var i;

        if (this.object === 'any') {
            for (i = 0; i < stateKeys.length; i++) {
                state = telemetryState[stateKeys[i]];
                result = this.evaluateState(state);
                if (result) {
                    return true;
                }
            }
            return false;
        } else if (this.object === 'all') {
            for (i = 0; i < stateKeys.length; i++) {
                state = telemetryState[stateKeys[i]];
                result = this.evaluateState(state);
                if (!result) {
                    return false;
                }
            }
            return true;
        } else {
            return this.evaluateState(telemetryState[this.object]);
        }
    };

    SummaryWidgetCondition.prototype.evaluateState = function (state) {
        var testValues = [
            state.formats[this.key].parse(state.lastDatum)
        ].concat(this.values);
        return this.comparator(testValues);
    };

    return SummaryWidgetCondition;
});
