define([
    './Model'
], function (
    Model
) {

    /**
     * TODO: doc strings.
     */
    var XAxisModel = Model.extend({
        initialize: function (options) {
            this.plot = options.plot;
            this.on('change:range', function (newValue, oldValue, model) {
                if (!model.get('frozen')) {
                    model.set('displayRange', newValue);
                }
            });

            this.on('change:frozen', function (frozen, oldValue, model) {
                if (!frozen) {
                    model.set('range', this.get('range'));
                }
            });

            if (this.get('range')) {
                this.set('range', this.get('range'));
            }
            this.listenTo(this, 'change:key', this.changeKey, this);
        },
        changeKey: function (newKey) {
            var series = this.plot.series.first();
            if (series) {
                var xMetadata = series.metadata.value(newKey);
                var xFormat = series.formats[newKey];
                this.set('label', xMetadata.name);
                this.set('format', xFormat.format.bind(xFormat));
            } else {
                this.set('format', function (x) { return x;});
                this.set('label', newKey);
            }
            this.plot.series.forEach(function (series) {
                series.set('xKey', newKey);
                series.reset();
            });
        },
        defaults: function (options) {
            var bounds = options.openmct.time.bounds();
            var timeSystem = options.openmct.time.timeSystem();
            var format = options.openmct.$injector.get('formatService')
                .getFormat(timeSystem.timeFormat);

            return {
                name: timeSystem.name,
                key: timeSystem.key,
                format: format.format.bind(format),
                range: {
                    min: bounds.start,
                    max: bounds.end
                },
                frozen: false
            };
        }
    });

    return XAxisModel;
});
