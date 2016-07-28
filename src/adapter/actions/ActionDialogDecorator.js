define([], function () {
    function ActionDialogDecorator(mct, newViews, actionService) {
        this.actionService = actionService;
        this.mct = mct;
        this.propertiesViews = newViews.filter(function (propertiesView) {
            return propertiesView.region === mct.regions.properties;
        });
    }

    ActionDialogDecorator.prototype.getActions = function (context) {
        var mct = this.mct;
        var definitions = this.propertiesViews;

        return this.actionService.getActions(context).map(function (action) {
            if (action.dialogService) {
                var domainObject = context.domainObject;

                definitions = definitions.filter(function (definition) {
                    return definition.canView(domainObject);
                });

                if (definitions.length > 0) {
                    action.dialogService = Object.create(action.dialogService);
                    action.dialogService.getUserInput = function (form, value) {
                        mct.dialog(definitions[0].view(domainObject), form.title);
                        return Promise.resolve(value);
                    };
                }
            }
            return action;
        });
    };

    return ActionDialogDecorator;
});
