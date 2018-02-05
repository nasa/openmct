define([
    './Model'
], function (
    Model
) {

    /**
     * TODO: doc strings.
     */
    var LegendModel = Model.extend({
        listenToSeriesCollection: function (seriesCollection) {
            this.seriesCollection = seriesCollection;
            this.listenTo(this.seriesCollection, 'add', this.setHeight, this);
            this.listenTo(this.seriesCollection, 'remove', this.setHeight, this);
            this.listenTo(this, 'change:expanded', this.setHeight, this);
            this.set('expanded', this.get('expandByDefault'));
        },
        setHeight: function () {
            var expanded = this.get('expanded');
            if (this.get('position') !== 'top') {
                this.set('height', '0px');
            } else {
                this.set('height', expanded ? (20 * (this.seriesCollection.size() + 1) + 40) + 'px' : '21px');
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
