define([
    './Model'
], function (
    Model
) {

    var YAxisModel = Model.extend({
        initialize: function (options) {
            this.on('change:range', function (newValue, oldValue, model) {
                if (!newValue) {
                    this.unset('displayRange');
                    return
                }
                if (model.get('autoscale')) {
                    var padding = Math.abs(newValue.max - newValue.min) * model.get('autoscalePadding');
                    if (padding === 0) {
                        padding = 1;
                    }
                    model.set('displayRange', {
                        min: newValue.min - padding,
                        max: newValue.max + padding,
                    });
                } else {
                    model.set('displayRange', newValue);
                }
            });

            this.on('change:autoscale', function (autoscale, oldValue, model) {
                model.set('range', model.get('range')); // trigger autoscale
            });
            this.on('change:autoscalePadding', function (padding, old, model) {
                if (model.get('autoscale')) {
                    model.set('range', model.get('range'));
                }
            });

            if (this.get('range')) {
                this.set('range', this.get('range'));
            }
        },
        enableAutoscale: function () {
            // TODO: establish stat listeners and set initial range.

        },
        disableAutoscale: function () {
            // TODO: remove stat listeners and set hardcoded values.
        },
        defaults: function (options) {
            return {
                autoscalePadding: 0.1
            };
        }
    });

    return YAxisModel;

});
