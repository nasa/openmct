define([
    'text!./summary-widget.html'
], function (
    summaryWidgetTemplate
) {
    function SummaryWidgetView(domainObject, openmct) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.hasUpdated = false;
    }

    SummaryWidgetView.prototype.updateState = function (datum) {
        this.hasUpdated = true;
        this.widget.style.color = datum.textColor;
        this.widget.style.backgroundColor = datum.backgroundColor;
        this.widget.style.borderColor = datum.borderColor;
        this.widget.title = datum.message;
        this.label.innerHTML = datum.ruleLabel;
        this.label.className = 'label widget-label ' + datum.icon;
    };

    SummaryWidgetView.prototype.render = function (domainObject) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.hasUpdated = false;

        this.container.innerHTML = summaryWidgetTemplate;
        this.widget = this.container.querySelector('a');
        this.label = this.container.querySelector('.widget-label');


        if (domainObject.url) {
            this.widget.setAttribute('href', domainObject.url);
        } else {
            this.widget.removeAttribute('href');
        }

        if (domainObject.openNewTab === 'newTab') {
            this.widget.setAttribute('target', '_blank');
        } else {
            this.widget.removeAttribute('target');
        }
        var renderTracker = {};
        this.renderTracker = renderTracker;
        this.openmct.telemetry.request(this.domainObject, {
            strategy: 'latest',
            size: 1
        }).then(function (results) {
            if (this.hasUpdated || this.renderTracker !== renderTracker) {
                return;
            }
            this.updateState(results[results.length - 1]);
        }.bind(this));

        this.unsubscribe = this.openmct
            .telemetry
            .subscribe(domainObject, this.updateState.bind(this));
    };

    SummaryWidgetView.prototype.show = function (container) {
        this.container = container;
        this.render(this.domainObject);
        this.removeMutationListener = this.openmct.objects.observe(
            this.domainObject,
            '*',
            this.render.bind(this)
        );
    };

    SummaryWidgetView.prototype.destroy = function (container) {
        this.unsubscribe();
        this.removeMutationListener();
        delete this.widget;
        delete this.label;
        delete this.openmct;
        delete this.domainObject;
    };

    return SummaryWidgetView;

});
