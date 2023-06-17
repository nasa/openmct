define(['../SummaryWidget', './SummaryWidgetView', 'objectUtils'], function (
  SummaryWidgetEditView,
  SummaryWidgetView,
  objectUtils
) {
  const DEFAULT_VIEW_PRIORITY = 100;
  /**
   *
   */
  function SummaryWidgetViewProvider(openmct) {
    return {
      key: 'summary-widget-viewer',
      name: 'Summary View',
      cssClass: 'icon-summary-widget',
      canView: function (domainObject) {
        return domainObject.type === 'summary-widget';
      },
      canEdit: function (domainObject) {
        return domainObject.type === 'summary-widget';
      },
      view: function (domainObject) {
        return new SummaryWidgetView(domainObject, openmct);
      },
      edit: function (domainObject) {
        return new SummaryWidgetEditView(domainObject, openmct);
      },
      priority: function (domainObject) {
        if (domainObject.type === 'summary-widget') {
          return Number.MAX_VALUE;
        } else {
          return DEFAULT_VIEW_PRIORITY;
        }
      }
    };
  }

  return SummaryWidgetViewProvider;
});
