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
var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");
var rightClick = require("../common/RightMenu");
describe('Create Clock', function() {
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var rightClickClass = new rightClick();

    var ITEM_NAME = "Clock";
    var ITEM_TYPE = "clock";
    var ITEM_MENU_GLYPH = 'C\nClock';
    var ITEM_GRID_SELECT = 'P\nC\nClock';
    beforeEach(require('../common/Launch'));
    it('should Create new Clock', function(){
        //button.click()
        browser.wait(function() {
           createClass.createButton().click();
           return true;
        }).then(function (){
            var folder =  createClass.selectNewItem(ITEM_TYPE)
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            browser.sleep(1000);
               folder.click()
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createClass.fillFolderForum(ITEM_NAME,ITEM_TYPE).click();
            browser.sleep(1000);
        }).then(function (){
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            browser.sleep(1000);
        });

    });
    it('should check clock', function () {

        function getTime(flag) {
            function addZero(time){
                if(time < 10){
                    return '0' + time;
                }
                return time;
            }
           var currentdate = new Date();

           var month = currentdate.getMonth() + 1;
           month = addZero(month);

           var day = currentdate.getDate();
           day = addZero(day);

           var hour = currentdate.getHours() - 5;
           hour = addZero(hour);

           var second = currentdate.getSeconds();
           if(flag == true) {
               second = second + 1;
           }
           second = addZero(second);

           var minute = currentdate.getMinutes();
           minute = addZero(minute);

           return ("UTC " + currentdate.getFullYear()  + "/" + (month) + "/" +
                    day + " " + (hour) + ":" + minute + ":" + second + " PM");
       }
       this.addMatchers({
           toBeIn: function(expected){
               var posibilities = Array.isArray(this.actual) ? this.actual : [this.actual];
               return posibilities.indexOf(expected) > -1;
           }
       })
        rightClickClass.select(ITEM_MENU_GLYPH, true).click().then(function () {
            browser.sleep(1000);
            browser.executeScript(getTime, false).then(function(current){
                    browser.executeScript(getTime, true).then(function(current1) {
                        var clock = element(by.css('.l-time-display.l-digital.l-clock.s-clock.ng-scope'));
                        clock.getText().then(function (ele) {
                            expect([current,current1]).toBeIn(ele);
                        })    
                    });
            });
            
        })
    });
});
