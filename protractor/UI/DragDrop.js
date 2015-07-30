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
var fullScreenFile = require("../common/Buttons");
var createItem = require("../common/CreateItem")
var itemEdit = require("../common/EditItem");
var rightMenu = require("../common/RightMenu");
var Drag = require("../common/drag");

describe('Test Drag and Drop', function() {
    var fullScreenClass = new fullScreenFile();
    var createClass = new createItem();
    var editItemClass = new itemEdit();
    var rightMenuClass = new rightMenu();
    var dragDrop = new Drag();

    beforeEach(require('../common/Launch'));

    it('should create a folder', function(){
        var ITEM_NAME = "Folder";
        var ITEM_TYPE = "folder";
        var ITEM_MENU_GLYPH = 'F\nFolder';
        var ITEM_GRID_SELECT = 'P\nF\nFolder\n0 Items';

        browser.wait(function() {
           return createClass.createButton().click();
        }).then(function (){
            var folder =  createClass.selectNewItem(ITEM_TYPE);
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            browser.sleep(1000);
            folder.click()
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
            browser.sleep(1000);
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            browser.sleep(1000);
        });
    });
    it('should create a timer',function (){
        var ITEM_NAME = "Timer";
        var ITEM_TYPE = "timer";
        var ITEM_MENU_GLYPH = 'õ\nTimer';
        var ITEM_GRID_SELECT = 'P\nõ\nTimer';

        browser.wait(function() {
           return createClass.createButton().click();
        }).then(function (){
            var folder =  createClass.selectNewItem(ITEM_TYPE)
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            browser.sleep(1000);
               folder.click()
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
            browser.sleep(1500);
        }).then(function (){
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            browser.sleep(1000);
        });

    });
    it('should drag timer into folder', function(){
        var ITEM_SIDE_SELECT = ">\nF\nFolder"
        var name = "õ\nTimer";

        rightMenuClass.select(ITEM_SIDE_SELECT, true).click();
        browser.sleep(2000);
        var object = element.all(by.css('.ng-isolate-scope.ng-pristine.ng-valid')).filter(function (ele){
            return ele.getText().then(function(text) {
                return text === name;
            });
        });
        var clock = object.get(1);
        var panel = element(by.css('.items-holder.grid.abs.ng-scope'));

        //drag
        expect(panel.isPresent()).toBe(true)
        expect(clock.isPresent()).toBe(true)
        browser.executeScript(dragDrop.DragDrop,clock.getWebElement(),panel.getWebElement())
        browser.sleep(3000);
        //check
        var dragObject = element.all(by.repeater('childObject in composition')).filter(function (ele) {
            return ele.getText().then(function(text) {
                return text === "P\nõ\nTimer"
            })
        })//output console.log
        /*expect(dragObject.get(0).isPresent()).toBe(true);
        browser.manage().logs().get('browser').then(function(browserLogs) {
            browserLogs.forEach(function(log){
                console.log(log.message);
           });
        });*/
    });
    it('should delete the Folder Item', function(){
        var ITEM_SIDE_SELECT = ">\nF\nFolder"
        browser.wait(function() {
            return element.all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).isDisplayed();
        });
        rightMenuClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });
    it('should delete the Timer Item', function(){
        var ITEM_SIDE_SELECT = "õ\nTimer";
        browser.wait(function() {
            return element.all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).isDisplayed();
        });
        rightMenuClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });
});
