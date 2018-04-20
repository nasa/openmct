define([
    '../SummaryWidget',
    './SummaryWidgetView',
    '../../../../api/objects/object-utils'
], function (
    SummaryWidgetEditView,
    SummaryWidgetView,
    objectUtils
) {


    /**
     *
     */
    function SummaryWidgetViewProvider(openmct) {
        return {
            key: 'summary-widget-viewer',
            name: 'Widget View',
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
                return 1;
            }
        };
    }

    return SummaryWidgetViewProvider;
});
