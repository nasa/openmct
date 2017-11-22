define([
    './Model'
], function (
    Model
) {

    var XAxisModel = Model.extend({
        initialize: function (options) {
            this.on('change:range', function (newValue, oldValue, model) {
                model.set('displayRange', newValue);
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
                }
            };
        }
    });

    return XAxisModel;
});
