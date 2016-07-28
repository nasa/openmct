define([], function () {
    function ActionDialogDecorator(mct, actionService) {
        this.actionService = actionService;
        this.mct = mct;
    }

    ActionDialogDecorator.prototype.getActions = function (context) {
        var mct = this.mct;
        return this.actionService.getActions(context).map(function (action) {
            if (action.dialogService) {
                action.dialogService = Object.create(action.dialogService);
                action.dialogService.getUserInput = function (form, value) {
                    mct.dialog({
                        show: function (container) {
                            container.textContent = JSON.stringify(value);
                        },
                        destroy: function () {}
                    }, form.title);
                    return Promise.resolve(value);
                }
            }
            return action;
        });
    };

    return ActionDialogDecorator;
});
