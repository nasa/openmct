define(['./summary-widget.html', '@braintree/sanitize-url'], function (
  summaryWidgetTemplate,
  urlSanitizeLib
) {
  const WIDGET_ICON_CLASS = 'c-sw__icon js-sw__icon';

  function SummaryWidgetView(domainObject, openmct) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.hasUpdated = false;
    this.render = this.render.bind(this);
  }

  SummaryWidgetView.prototype.updateState = function (datum) {
    this.hasUpdated = true;
    this.widget.style.color = datum.textColor;
    this.widget.style.backgroundColor = datum.backgroundColor;
    this.widget.style.borderColor = datum.borderColor;
    this.widget.title = datum.message;
    this.label.title = datum.message;
    this.label.innerHTML = datum.ruleLabel;
    this.icon.className = WIDGET_ICON_CLASS + ' ' + datum.icon;
  };

  SummaryWidgetView.prototype.render = function () {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.hasUpdated = false;

    this.container.innerHTML = summaryWidgetTemplate;
    this.widget = this.container.querySelector('a');
    this.icon = this.container.querySelector('#widgetIcon');
    this.label = this.container.querySelector('.js-sw__label');

    let url = this.domainObject.url;
    if (url) {
      this.widget.setAttribute('href', urlSanitizeLib.sanitizeUrl(url));
    } else {
      this.widget.removeAttribute('href');
    }

    if (this.domainObject.openNewTab === 'newTab') {
      this.widget.setAttribute('target', '_blank');
    } else {
      this.widget.removeAttribute('target');
    }

    const renderTracker = {};
    this.renderTracker = renderTracker;
    this.openmct.telemetry
      .request(this.domainObject, {
        strategy: 'latest',
        size: 1
      })
      .then(
        function (results) {
          if (
            this.destroyed ||
            this.hasUpdated ||
            this.renderTracker !== renderTracker ||
            results.length === 0
          ) {
            return;
          }

          this.updateState(results[results.length - 1]);
        }.bind(this)
      );

    this.unsubscribe = this.openmct.telemetry.subscribe(
      this.domainObject,
      this.updateState.bind(this)
    );
  };

  SummaryWidgetView.prototype.show = function (container) {
    this.container = container;
    this.render();
    this.removeMutationListener = this.openmct.objects.observe(
      this.domainObject,
      '*',
      this.onMutation.bind(this)
    );
    this.openmct.time.on('timeSystem', this.render);
  };

  SummaryWidgetView.prototype.onMutation = function (domainObject) {
    this.domainObject = domainObject;
    this.render();
  };

  SummaryWidgetView.prototype.destroy = function (container) {
    this.unsubscribe();
    this.removeMutationListener();
    this.openmct.time.off('timeSystem', this.render);
    this.destroyed = true;
    delete this.widget;
    delete this.label;
    delete this.openmct;
    delete this.domainObject;
  };

  return SummaryWidgetView;
});
