define([
    '../../api/objects/object-utils'
], function (objectUtils) {
    function ActionDialogDecorator(mct, newViews, actionService) {
        this.actionService = actionService;
        this.mct = mct;
        this.definitions = newViews.filter(function (newView) {
            return newView.region === mct.regions.properties;
        }).map(function (newView) {
            return newView.factory;
        });
    }

    ActionDialogDecorator.prototype.getActions = function (context) {
        var mct = this.mct;
        var definitions = this.definitions;

        return this.actionService.getActions(context).map(function (action) {
            if (action.dialogService) {
                var domainObject = objectUtils.toNewFormat(
                    context.domainObject.getModel(),
                    objectUtils.parseKeyString(context.domainObject.getId())
                );

                definitions = definitions.filter(function (definition) {
                    return definition.canView(domainObject);
                });

                if (definitions.length > 0) {
                    action.dialogService = Object.create(action.dialogService);
                    action.dialogService.getUserInput = function (form, value) {
                        mct.dialog(
                            definitions[0].view(context.domainObject),
                            form.title
                        );
                        return Promise.resolve(value);
                    };
                }
            }
            return action;
        });
    };

    return ActionDialogDecorator;
});
