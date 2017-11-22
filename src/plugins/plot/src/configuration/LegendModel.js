define([
    './Model'
], function (
    Model
) {

    var LegendModel = Model.extend({
        initialize: function (options) {
            this.on('change:range', function (newValue, oldValue, model) {
                model.set('displayRange', newValue);
            });

            if (this.get('range')) {
                this.set('range', this.get('range'));
            }
        },
        defaults: function (options) {
            return {
                position: 'top',
                expandByDefault: false,
                valueToShowWhenCollapsed: 'nearestValue',
                showTimestampWhenExpanded: true,
                showValueWhenExpanded: true,
                showMaximumWhenExpanded: true,
                showMinimumWhenExpanded: true
            };
        }
    });

    return LegendModel;
});
