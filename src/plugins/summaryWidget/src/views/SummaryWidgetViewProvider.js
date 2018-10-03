define([
    '../SummaryWidget',
    './SummaryWidgetView',
    '../../../../api/objects/object-utils'
], function (
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
            view: function (domainObject) {
                var statusService = openmct.$injector.get('statusService');
                var objectId = objectUtils.makeKeyString(domainObject.identifier);
                var statuses = statusService.listStatuses(objectId);
                var isEditing = statuses.indexOf('editing') !== -1;

                if (isEditing) {
                    return new SummaryWidgetEditView(domainObject, openmct);
                } else {
                    return new SummaryWidgetView(domainObject, openmct);
                }
            },
            editable: true,
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
