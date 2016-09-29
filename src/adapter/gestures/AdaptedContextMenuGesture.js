define(
    function () {
        function AdaptedContextMenuGesture(openmct, $els, domainObject) {
            this.destroy = openmct.gestures.contextual($els[0], domainObject);
        }

        return AdaptedContextMenuGesture;
    }
);
