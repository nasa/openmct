define([
    './Model'
], function (
    Model
) {

    var XAxisModel = Model.extend({
        initialize: function (options) {
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
