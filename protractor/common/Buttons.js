var Buttons = (function () {
    function Buttons() {
    }
    //finds the Edit Button
    Buttons.prototype.fullScreen = function () {
        element(by.css('[title="Enter full screen mode"]')).click();
        
    };
    Buttons.prototype.newWidnow = function () {
        return element.all(by.css('[ng-click="parameters.action.perform()"]')).filter(function (arg) {
            return arg.getAttribute("title").then(function (title){
                //expect(title).toEqual("Edit this object.");
                return title == 'Open in a new browser tab';
            })
        });
    };
    return Buttons;
    
})();
module.exports = Buttons;
