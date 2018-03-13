define([
    './SummaryWidgetRule',
    '../eventHelpers',
    '../../../../api/objects/object-utils',
    'lodash'
], function (
    SummaryWidgetRule,
    eventHelpers,
    objectUtils,
    _
) {

    /**
     * evaluates rules defined in a summary widget against either lad or
     * realtime state.
     *
     * Does not handle mutation.
     */
    function SummaryWidgetEvaluator(domainObject, openmct) {
        this.openmct = openmct;
        this.baseState = {};

        this.rules = domainObject.configuration.ruleOrder.map(function (ruleId) {
            return new SummaryWidgetRule(domainObject.configuration.ruleConfigById[ruleId]);
        });

        var composition = openmct.composition.get(domainObject);

        this.listenTo(composition, 'add', this.addChild, this);
        this._loadPromise = composition.load();

        this.load()
            .then(function () {
                this.stopListening();
            }.bind(this));
    }

    SummaryWidgetEvaluator.prototype.load = function () {
        return this._loadPromise;
    };

    /**
     * return a promise for a clone of the base state object.
     */
    SummaryWidgetEvaluator.prototype.getBaseStateClone = function () {
        return this.load()
            .then(function () {
                return _(this.baseState)
                    .values()
                    .map(_.clone)
                    .indexBy('id')
                    .value();
            }.bind(this));
    };

    eventHelpers.extend(SummaryWidgetEvaluator.prototype);

    SummaryWidgetEvaluator.prototype.addChild = function (childObject) {
        var childId = objectUtils.makeKeyString(childObject.identifier);
        var metadata = this.openmct.telemetry.getMetadata(childObject);
        var formats = this.openmct.telemetry.getFormatMap(metadata);

        this.baseState[childId] = {
            id: childId,
            domainObject: childObject,
            metadata: metadata,
            formats: formats
        };
    };

    /**
     * Subscribes to realtime updates for a given objectState, and invokes
     * the supplied callback when objectState has been updated.  Returns
     * a function to unsubscribe.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.subscribeToObjectState = function (callback, objectState) {
        return this.openmct.telemetry.subscribe(
            objectState.domainObject,
            function (datum) {
                objectState.lastDatum = datum;
                objectState.timestamps = this.getTimestamps(objectState.id, datum);
                callback();
            }.bind(this)
        );
    };

    /**
     * Subscribes to realtime telemetry for the given summary widget.
     */
    SummaryWidgetEvaluator.prototype.subscribe = function (callback) {
        var active = true;
        var unsubscribes = [];

        this.getBaseStateClone()
            .then(function (realtimeStates) {
                if (!active) {
                    return;
                }
                var updateCallback = function () {
                    var datum = this.evaluateState(
                        realtimeStates,
                        this.openmct.time.timeSystem().key
                    );
                    callback(datum);
                }.bind(this);

                unsubscribes = _.map(
                    realtimeStates,
                    this.subscribeToObjectState.bind(this, updateCallback)
                );
            }.bind(this));

        return function unsubscribe() {
            active = false;
            unsubscribes.forEach(function (unsubscribe) {
                unsubscribe();
            });
        };
    };

    /**
     * Returns a promise for a telemetry datum obtained by evaluating the
     * current lad data.
     */
    SummaryWidgetEvaluator.prototype.requestLatest = function (options) {
        return this.getBaseStateClone()
            .then(function (ladState) {
                var promises = Object.values(ladState)
                    .map(this.updateObjectStateFromLAD.bind(this, options));

                return Promise.all(promises)
                    .then(function () {
                        return ladState;
                    });
            }.bind(this))
            .then(function (ladStates) {
                return this.evaluateState(ladStates, options.domain);
            }.bind(this));
    };

    /**
     * Given an object state, will return a promise that is resolved when the
     * object state has been updated from the LAD.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.updateObjectStateFromLAD = function (options, objectState) {
        options = _.extend({}, options, {
            strategy: 'latest',
            size: 1
        });
        return this.openmct
            .telemetry
            .request(
                objectState.domainObject,
                options
            )
            .then(function (results) {
                objectState.lastDatum = results[results.length - 1];
                objectState.timestamps = this.getTimestamps(
                    objectState.id,
                    objectState.lastDatum
                );
            }.bind(this));
    };

    /**
     * Returns an object containing all domain values in a datum.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.getTimestamps = function (childId, datum) {
        var timestampedDatum = {};
        this.openmct.time.getAllTimeSystems().forEach(function (timeSystem) {
            timestampedDatum[timeSystem.key] =
                this.baseState[childId].formats[timeSystem.key].parse(datum);
        }, this);
        return timestampedDatum;
    };

    /**
     * Given a base datum(containing timestamps) and rule index, adds values
     * from the matching rule.
     */
    SummaryWidgetEvaluator.prototype.makeDatumFromRule = function (ruleIndex, baseDatum) {
        var rule = this.rules[ruleIndex];

        baseDatum.color = rule.color;
        baseDatum.ruleName = rule.name;
        baseDatum.ruleIndex = ruleIndex;
        baseDatum.backgroundColor = rule.style['background-color'];
        baseDatum.textColor = rule.style.color;
        baseDatum.borderColor = rule.style['border-color'];
        baseDatum.icon = rule.icon;

        return baseDatum;
    };

    /**
     * evaluate a state object and return a summary widget telemetry datum.
     * Will use the specified timestampKey to decide which timestamps to apply.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.evaluateState = function (state, timestampKey) {
        var latestTimestamp = _(state)
            .map('timestamps')
            .sortBy(timestampKey)
            .first();

        latestTimestamp = _.clone(latestTimestamp);

        for (var i = this.rules.length - 1; i > 0; i--) {
            if (this.rules[i].evaluate(state, false)) {
                break;
            }
        }

        return this.makeDatumFromRule(i, latestTimestamp);
    };

    return SummaryWidgetEvaluator;

});
