/*global define*/

define(function () {
    /**
     * Simple directive that removes the elements pool when used in the
     * inspector region.  Workaround until we have better control of screen
     * regions.
     */
    return function HideElementPoolDirective() {
        return {
            restrict: "A",
            link: function ($scope, $element) {
                var splitter = $element.parent(),
                    elementsContainer;
                while (splitter[0].tagName !== 'MCT-SPLIT-PANE') {
                    splitter = splitter.parent();
                }

                [
                    '.split-pane-component.pane.bottom',
                    'mct-splitter'
                ].forEach(function (selector) {
                    var element = splitter[0].querySelectorAll(selector)[0];
                    element.style.maxHeight = '0px';
                    element.style.minHeight = '0px';
                });

                splitter[0]
                    .querySelectorAll('.split-pane-component.pane.top')[0]
                    .style
                    .bottom = '0px';
            }
        };
    };
});
