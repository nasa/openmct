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
var right_click = require("../common/RightMenu.js");
    
describe('Create Folder', function() {
    var clickClass = new right_click();
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Folder";
    var ITEM_TYPE = "folder";
    var ITEM_MENU_GLYPH = 'F\nFolder';
    var ITEM_GRID_SELECT = 'P\nF\nFolder\n0 Items';
    var ITEM_SIDE_SELECT = ">\nF\nFolder"
    
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should Create new Folder', function(){
        browser.sleep(10000);
        for(var i=0; i < 1000; i++){
            browser.wait(function() {
               createClass.createButton().click(); 
               return true;    
            }).then(function (){
                element.all(by.css('.items-holder.grid.abs.ng-scope')).click();  
            })
        }
        browser.pause();
                
    });
     
});
