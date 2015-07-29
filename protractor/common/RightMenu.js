
var RightMenu = (function () {
    
    function RightMenu() {
    }
    //RightMenu Click on Object
    RightMenu.prototype.delete = function (name, flag) {
        if(flag === 'undefined'){
            flag = true;
        }
        if(flag === true){
            var carrot = element.all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).get(0).click();
        }
        browser.sleep(1000)
        var object = element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
                //expect(text).toEqual("3");
                return text === name;
            });
        });
        browser.sleep(1000)
        browser.actions().mouseMove(object.get(0)).perform();
        browser.actions().click(protractor.Button.RIGHT).perform();
        browser.sleep(1000)
        var remove = element.all(by.css('.ng-binding')).filter(function (ele){
            return ele.getText().then(function (text) {
                return text == "Z\nRemove";
           })
        }).click();
        browser.sleep(1000)
        element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
                return text === name;
            });
        }).then(function (folder) {
            expect(folder.length).toBe(0);
        });
    };
    RightMenu.prototype.reset = function (name) {
        var carrot = element.all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).click();
        browser.sleep(1000)
        var object = element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
                //expect(text).toEqual("3");
                return text === name;
            });
        }).click();
        browser.sleep(1000)
        browser.actions().mouseMove(object.get(0)).perform();
        browser.actions().click(protractor.Button.RIGHT).perform();
        browser.sleep(1000)
        var remove = element.all(by.css('.ng-binding')).filter(function (ele){
            return ele.getText().then(function (text) {
                return text == "r\nRestart at 0";
           })
        }).click();
    };
    RightMenu.prototype.select = function(name, flag){
        if(typeof flag == "undefined"){
            flag = true;
        }
        //click '<', true==yes false==no
        if(flag == true){
            var carrot = element.all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).click();
        }
        browser.sleep(1000)
        return element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
            //    expect(text).toEqual("3");
                return text === name;
            });
        });
        
    };
    RightMenu.prototype.dragDrop = function(name){
        var object = element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
                //expect(text).toEqual("3");
                return text === name;
            });
        });
        var folder = object.get(0);
        var panel = element(by.css('.items-holder.grid.abs.ng-scope'));
        
        browser.actions().dragAndDrop(folder, panel).perform();
    };
    return RightMenu;
    
})();
module.exports = RightMenu;
