var EditItem = (function () {
    function EditItem() {
    }
    //finds the Edit Button
    EditItem.prototype.SelectItem = function (item_title) {
        return element.all(by.css('.item.grid-item.ng-scope')).filter(function (arg){ 
            return arg.getText().then(function (text) {
               // expect(text).toEqual("fh");
                return text == item_title;
            });
        });
    };
    EditItem.prototype.EditButton = function () {
        return element.all(by.css('[ng-click="parameters.action.perform()"]')).filter(function (arg) {
            return arg.getAttribute("title").then(function (title){
                //expect(title).toEqual("Edit this object.");
                return title == 'Edit this object.';
            })
        });
    };
    EditItem.prototype.CreateActivity = function () {
        element.all(by.css('[ng-controller="ClickAwayController as toggle"]')).click();
        browser.sleep(1000);
        var list = element.all(by.css('[ng-repeat="option in structure.options"]')).filter(function (arg){
            return arg.getText().then(function (text){
                //expect(text).toEqual("Edit this object.");
                return text == "a\nActivity";
            });
        }).click();
    };
    EditItem.prototype.saveButton = function () {
         element.all(by.css('[ng-click="currentAction.perform()"]')).filter(function (args){
            return args.getText().then(function (text) {
                //expect(text).toEqual("Save");
                return text == "Save"; 
            });
        }).click();
    };
    function getFolderType(arg) {

    }
    return EditItem;
    
})();
module.exports = EditItem;
