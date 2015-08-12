/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

var RightMenu = (function () {
    
    function RightMenu() {
    }
    function carrotMyItem(){
        var MyItem =  ">\nF\nMy Items"
        element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
                return text === MyItem;
            });
        }).all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).click();
    }
    //RightMenu Click on Object
    RightMenu.prototype.delete = function (name, flag) {
        if(typeof flag === 'undefined'){
            flag = true;
        }
        if(flag === true){
           carrotMyItem();
        }
        browser.sleep(1000)
        var object = element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
                return text === name;
            });
        });
        browser.sleep(1000)
        browser.actions().mouseMove(object.get(0)).perform();
        browser.actions().click(protractor.Button.RIGHT).perform();
        browser.sleep(1000)
        element.all(by.css('.ng-binding')).filter(function (ele){
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
        carrotMyItem();
        browser.sleep(1000)
        var object = element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
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
        browser.sleep(1000)
    };
    //click '<', true==yes false==no
    RightMenu.prototype.select = function(name, flag){
        if(typeof flag == "undefined"){
            flag = true;
        }
        if(flag == true){
           carrotMyItem();
        }
        browser.sleep(1000)
        return element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
                return text === name;
            });
        });
        
    };
    RightMenu.prototype.dragDrop = function(name){
        var object = element.all(by.repeater('child in composition')).filter(function (ele){
            return ele.getText().then(function(text) {
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
