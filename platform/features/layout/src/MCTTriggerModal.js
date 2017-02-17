define([

], function () {

    var OVERLAY_TEMPLATE = '' +
'<div class="abs overlay l-large-view">' +
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
                overlay,
                closeButton,
                blocker,
                overlayContainer;

            function openOverlay() {
                // Remove frame classes from being applied in a non-frame context
                $(frame).removeClass('frame frame-template');
                overlayContainer = overlay.querySelector('.abs.contents');
                closeButton = overlay.querySelector('a.close');
                closeButton.addEventListener('click', toggleOverlay);
                blocker = overlay.querySelector('.abs.blocker');
                blocker.addEventListener('click', toggleOverlay);
                document.body.appendChild(overlay);
                layoutContainer.removeChild(frame);
                overlayContainer.appendChild(frame);
            }

            function closeOverlay() {
                $(frame).addClass('frame frame-template');
                overlayContainer.removeChild(frame);
                layoutContainer.appendChild(frame);
                document.body.removeChild(overlay);
                closeButton.removeEventListener('click', toggleOverlay);
                closeButton = undefined;
                blocker.removeEventListener('click', toggleOverlay);
                blocker = undefined;
                overlayContainer = undefined;
                overlay = undefined;
            }

            function initOpenOverlay() {
                overlay = document.createElement('span');
                overlay.innerHTML = OVERLAY_TEMPLATE;
                // Give expand anim time to run before populating
                setTimeout(openOverlay(), 5000);
            }

            function toggleOverlay() {
                if (!isOpen) {
                    initOpenOverlay();
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
