define(['zepto', './ContextMenuView'], function ($, ContextMenuView) {
    function ContextMenuGesture(
        selection,
        overlayManager,
        actionRegistry,
        contextManager
    ) {
        this.selection = selection;
        this.overlayManager = overlayManager;
        this.actionRegistry = actionRegistry;
        this.contextManager = contextManager;
    }

    ContextMenuGesture.prototype.apply = function (htmlElement, item) {
        var overlayManager = this.overlayManager;
        var selection = this.selection;
        var actionRegistry = this.actionRegistry;
        var contextManager = this.contextManager;

        var $element = $(htmlElement);
        var context = contextManager.context(item, htmlElement);

        function showMenu(event) {
            selection.add(context);

            var x = event.clientX;
            var y = event.clientY;
            var actions = actionRegistry.get(context);
            var view = new ContextMenuView(actions);

            overlayManager.show(view, x, y);

            event.preventDefault();
        }

        $element.on('contextmenu', showMenu);

        return $element.off.bind($element, 'contextmenu', showMenu);
    };

    return ContextMenuGesture;
});
