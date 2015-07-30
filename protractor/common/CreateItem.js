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
var CreateItem = (function () {
    function CreateItem() {}
    //finds the Create Button
    CreateItem.prototype.createButton = function () {
        return element.all(by.css('[ng-click="createController.toggle()"]')); 
    };
    function getFolderType(arg) {
        switch(arg) {
            case 'folder':
                return "F\nFolder"
                break;
            case 'display':
                return "L\nDisplay Layout"
                break;
            case 'telemetry':
                return "t\nTelemetry Panel"
                break;
            case 'webpage':
                return "ê\nWeb Page"
                break;
            case 'clock':
                return "C\nClock"
                break;
            case 'timer':
                return "õ\nTimer"
            case 'timeline':
                return "S\nTimeline"
                break;
            case 'activity':
                return "a\nActivity"
                break;
            case 'activity-mode':
                return "A\nActivity Mode"
                break;
            case 'sinewave':
                return "T\nSine Wave Generator"
                break;
            default:
                throw new Error("Unexpect State");
        }
    }
    //Selects Object from Create Menu
    CreateItem.prototype.selectNewItem = function (itemText) {
        item = getFolderType(itemText);
        browser.wait(function(){
            return element(by.css('[ng-click="createAction.perform()"]')).isPresent();
        }, 6000);
        this.els =element.all(by.css('[ng-click="createAction.perform()"]'));
        this.todoButton = this.els.filter(function(elem) {
            return elem.getText().then(function(text) {
                return text === item;
            });
        });
        return this.todoButton;
    };
    //Fills Out Folder Forum
    CreateItem.prototype.fillFolderForum = function (folderName, type) {
       this.namefields = element.all(by.css('[ng-required="ngRequired"]')).filter(function (elem) {
           return elem.getAttribute('type').then(function(text) {
               return text === 'text';
            });   
       });
     
       browser.sleep(1000);
       this.namefields.clear();
       browser.sleep(1000);
       
       this.namefields.get(0).sendKeys(folderName);
       switch(type) {
           case 'folder':
              // return "F\nFolder"
               break;
           case 'display':
               this.namefields.get(1).sendKeys("1");
               browser.sleep(1000);
               this.namefields.get(2).sendKeys("2");
               break;
           case 'telemetry':
               this.namefields.get(1).sendKeys("1");
               browser.sleep(1000);
               this.namefields.get(2).sendKeys("2");
               this.dropdownElement = element.all(by.model('ngModel[field]')).filter(function(elem) {
                   return elem.getTagName().then(function(tag) {
                       return tag === 'select';
                    });   
               });
               this.dropdownElement.click();
               this.dropdownElement.all(by.css('option')).get(1).click();
               browser.sleep(1000);
               break;
           case 'webpage':
               this.namefields.get(1).sendKeys("http://test.com");
                browser.sleep(1000);
                break;
            case 'clock':
                this.dropdownElement = element.all(by.model('ngModel[field]')).filter(function(elem) {
                    return elem.getTagName().then(function(tag) {
                        return tag === 'select';
                     });   
                });
                this.dropdownElement.get(0).click();
                this.dropdownElement.get(0).all(by.css('option')).get(0).click();
                browser.sleep(1000);
                this.dropdownElement.get(1).click();
                this.dropdownElement.get(1).all(by.css('option')).get(0).click();
                browser.sleep(1000);

                break;
            case 'timer':
                this.timerDate = element.all(by.model('datetime.date'));
                browser.sleep(1000);
                this.timerDate.clear().sendKeys("2015-07-22");
                browser.sleep(1000);
                this.timerDate = element.all(by.model('datetime.hour'));
                this.timerDate.get(0).sendKeys("7");
                this.timerDate = element.all(by.model('datetime.min'));
                this.timerDate.get(0).sendKeys("30");
                this.timerDate = element.all(by.model('datetime.sec'));
                this.timerDate.get(0).sendKeys("000");
                browser.sleep(1000);
                break;
            case 'timeline':
                this.timerDate = element.all(by.model('datetime.days'));
                this.timerDate.clear().sendKeys("10");
                browser.sleep(1000);
                this.timerDate = element.all(by.model('datetime.hours'));
                this.timerDate.get(0).sendKeys("7");
                this.timerDate = element.all(by.model('datetime.minutes'));
                this.timerDate.get(0).sendKeys("30");
                this.timerDate = element.all(by.model('datetime.seconds'));
                this.timerDate.get(0).sendKeys("3");
                browser.sleep(1000);
                break;
            case 'activity':
                this.startDay = element.all(by.model('datetime.days'));
                this.startDay.clear().sendKeys("10");
                this.startHours = element.all(by.model('datetime.hours'));
                this.startHours.get(0).clear().sendKeys("7");
                this.startMinutes = element.all(by.model('datetime.minutes'));
                this.startMinutes.get(0).clear().sendKeys("30");
                this.startSeconds = element.all(by.model('datetime.seconds'));
                this.startSeconds.get(0).clear().sendKeys("3");
                browser.sleep(1000);
                //Duration
                this.startDay.get(1).clear().sendKeys("1");
                this.startHours.get(1).clear().sendKeys("1");
                this.startMinutes.get(1).clear().sendKeys("0");
                this.startSeconds.get(1).clear().sendKeys("0");
                browser.sleep(1000);
                break;
            case 'activity-mode':
                this.namefields.get(1).sendKeys("55");
                browser.sleep(1000);
                this.namefields.get(2).sendKeys("10");
                break;
            case 'sinewave':
                this.namefields.get(1).sendKeys("10");
                browser.sleep(1000);
                break;
           default:
               throw new Error("Unexpect State");
       }
        return element.all(by.css('[ng-click="ngModel.confirm()"]'));
        
    };
    //TODO USAGE FOR CLICK ON OBJECT ONCE CREATED
    CreateItem.prototype.findFolder = function (){
        return element.all(by.css('[ng-click="action.perform("navigate")"]'));
    };
    return CreateItem;
    
})();
module.exports = CreateItem;
