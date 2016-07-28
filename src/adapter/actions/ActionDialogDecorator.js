define([], function () {
    function ActionDialogDecorator(actionService) {
        this.actionService = actionService;
    }

    ActionDialogDecorator.prototype.getActions = function (context) {
        return this.actionService.getActions(context).map(function (action) {
            if (action.dialogService) {
                action.dialogService = Object.create(action.dialogService);
                action.dialogService.getUserInput = function (form, value) {
                    window.alert("Get user input!");
                    return Promise.resolve(value);
                }
            }
            return action;
        });
    };

    return ActionDialogDecorator;
});
