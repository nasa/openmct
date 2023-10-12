import * as urlSanitizeLib from '@braintree/sanitize-url';

const WIDGET_ICON_CLASS = 'c-sw__icon js-sw__icon';

class SummaryWidgetView {
  #createSummaryWidgetTemplate() {
    const anchor = document.createElement('a');
    anchor.classList.add(
      't-summary-widget',
      'c-summary-widget',
      'js-sw',
      'u-links',
      'u-fills-container'
    );

    const widgetIcon = document.createElement('div');
    widgetIcon.id = 'widgetIcon';
    widgetIcon.classList.add('c-sw__icon', 'js-sw__icon');
    anchor.appendChild(widgetIcon);

    const widgetLabel = document.createElement('div');
    widgetLabel.id = 'widgetLabel';
    widgetLabel.classList.add('c-sw__label', 'js-sw__label');
    widgetLabel.textContent = 'Loading...';
    anchor.appendChild(widgetLabel);

    return anchor;
  }

  constructor(domainObject, openmct) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.hasUpdated = false;
    this.render = this.render.bind(this);
  }

  updateState(datum) {
    this.hasUpdated = true;
    this.widget.style.color = datum.textColor;
    this.widget.style.backgroundColor = datum.backgroundColor;
    this.widget.style.borderColor = datum.borderColor;
    this.widget.title = datum.message;
    this.label.title = datum.message;
    this.label.textContent = datum.ruleLabel;
    this.icon.className = WIDGET_ICON_CLASS + ' ' + datum.icon;
  }

  render() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.hasUpdated = false;

    const anchor = this.#createSummaryWidgetTemplate();
    this.container.appendChild(anchor);

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
      .then((results) => {
        if (
          this.destroyed ||
          this.hasUpdated ||
          this.renderTracker !== renderTracker ||
          results.length === 0
        ) {
          return;
        }

        this.updateState(results[results.length - 1]);
      });

    this.unsubscribe = this.openmct.telemetry.subscribe(
      this.domainObject,
      this.updateState.bind(this)
    );
  }

  show(container) {
    this.container = container;
    this.render();
    this.removeMutationListener = this.openmct.objects.observe(
      this.domainObject,
      '*',
      this.onMutation.bind(this)
    );
    this.openmct.time.on('timeSystem', this.render);
  }

  onMutation(domainObject) {
    this.domainObject = domainObject;
    this.render();
  }

  destroy() {
    this.unsubscribe();
    this.removeMutationListener();
    this.openmct.time.off('timeSystem', this.render);
    this.destroyed = true;
    delete this.widget;
    delete this.label;
    delete this.openmct;
    delete this.domainObject;
  }
}

export default SummaryWidgetView;
