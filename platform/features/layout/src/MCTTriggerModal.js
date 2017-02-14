define([

], function () {

    var OVERLAY_TEMPLATE = '' +
'<div class="abs overlay">' +
'    <div class="abs blocker"></div>' +
'    <div class="abs holder">' +
'        <a class="close icon-x"></a>' +
'        <div class="abs contents"></div>' +
'    </div>' +
'</div>';

    /**
     * MCT Trigger Modal is intended for use in only one location: inside the
     * object-header to allow views in a layout to be popped out in a modal.
     * Users can close the modal and go back to normal, and everything generally
     * just works fine.
     *
     * This code is sensitive to how our html is constructed-- particularly with
     * how it locates the the container of an element in a layout. However, it
     * should be able to handle slight relocations so long as it is always a
     * descendent of a `.frame` element.
     */
    function MCTTriggerModal() {

        function link($scope, $element) {
            var frame = $element.parent();

            for (var i = 0; i < 10; i++) {
                if (frame.hasClass('frame')) {
                    break;
                }
                frame = frame.parent();
            }
            if (!frame.hasClass('frame')) {
                $element.remove();
                return;
            }

            frame = frame[0];
            var layoutContainer = frame.parentElement,
                isOpen = false,
                span,
                closeButton,
                overlayContainer;

            function openOverlay() {
                span = document.createElement('span');
                span.innerHTML = OVERLAY_TEMPLATE;
                overlayContainer = span.querySelector('.abs.contents');
                closeButton = span.querySelector('a.close');
                closeButton.addEventListener('click', toggleOverlay);
                document.body.appendChild(span);
                layoutContainer.removeChild(frame);
                overlayContainer.appendChild(frame)
                $element.text('Return to Layout');
            }

            function closeOverlay() {
                overlayContainer.removeChild(frame);
                layoutContainer.appendChild(frame);
                $element.text('View Large');
                document.body.removeChild(span);
                closeButton.removeEventListener('click', toggleOverlay);
                closeButton = undefined;
                overlayContainer = undefined;
                span = undefined;
            }

            function toggleOverlay() {
                if (!isOpen) {
                    openOverlay();
                    isOpen = true;
                } else {
                    closeOverlay();
                    isOpen = false;
                }
            }

            $element.on('click', toggleOverlay);
            $scope.$on('$destroy', function () {
                $element.off('click');
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return MCTTriggerModal;

});
