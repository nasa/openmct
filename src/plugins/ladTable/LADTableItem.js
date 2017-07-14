define([
    'etch'
], function (
    etch
) {
    function LADTableItem(props, children) {
        this.props = props;
        this.props.values = props.values || {
            'name': props.domainObject.name,
            'timestamp': '---',
            'value': '---',
            'valueClass': ''
        };
        etch.initialize(this);
        this.metadata = props.openmct.telemetry.getMetadata(props.domainObject);
        this.valueMetadata = this.metadata.valuesForHints(['range'])[0];
        this.valueFormat = props.openmct.telemetry.getValueFormatter(this.valueMetadata);
        this.limitEvaluator = props.openmct.telemetry.limitEvaluator(props.domainObject);
        this.updateTimeSystem(props.openmct.time.timeSystem());

        this.stopWatchingMutation = props
            .openmct
            .objects
            .observe(props.domainObject, 'name', this.onNameChange.bind(this));
        this.unsubscribe = props
            .openmct
            .telemetry
            .subscribe(props.domainObject, this.onDatum.bind(this));
        props.openmct
            .telemetry
            .request(props.domainObject, {strategy: 'latest'})
            .then((values) => values.forEach(this.onDatum, this))
    }

    LADTableItem.prototype.updateTimeSystem = function (timeSystem) {
        var timeValue = this.metadata.value(timeSystem.key);
        this.timestampFormat = this.props.openmct.telemetry.getValueFormatter(timeValue);
        etch.update(this);
    };

    LADTableItem.prototype.onNameChange = function (name) {
        this.props.values.name = name;
        etch.update(this);
    };

    LADTableItem.prototype.updateValues = function () {
        this.props.values.timestamp = this.timestampFormat.format(this.datum);
        this.props.values.value = this.valueFormat.format(this.datum);
        const limit = this.limitEvaluator.evaluate(this.datum, this.valueMetadata);
        if (limit) {
            this.props.values.valueClass = limit.cssClass;
        } else {
            this.props.values.valueClass = '';
        }
    };

    LADTableItem.prototype.onDatum = function (datum) {
        this.datum = datum;
        this.updateValues();
        etch.update(this);
    };

    LADTableItem.prototype.render = function () {
        return etch.dom('tr', null,
            etch.dom('td', null, `${this.props.values.name}`),
            etch.dom('td', null, `${this.props.values.timestamp}`),
            etch.dom('td', {className: this.props.values.valueClass}, `${this.props.values.value}`)
        );
    };

    LADTableItem.prototype.update = function (props, children) {
        return etch.update(this)
    };

    LADTableItem.prototype.destroy = function () {
        this.stopWatchingMutation();
        this.unsubscribe();
    };

    return LADTableItem;
});
