define([
    'text!../res/templates/mct-example.html'
], function (
    MCTExampleTemplate
) {

    function MCTExample() {
        function link($scope, $element, $attrs, controller, $transclude) {
            var codeEl = $element.find('code');
            var exampleEl = $element.find('div');

            $transclude(function (clone) {
                exampleEl.append(clone);
                codeEl.text(exampleEl.html());
            });
        }

        return {
            restrict: "E",
            template: MCTExampleTemplate,
            transclude: true,
            link: link,
            replace: true
        };
    }

    return MCTExample;
});
