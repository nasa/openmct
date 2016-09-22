define(
    function () {
        function AdaptedContextMenuGesture(openmct, element, domainObject) {
            this.destroy = openmct.gestures.contextMenu(element, domainObject);
        }

        return AdaptedContextMenuGesture;
    }
);
