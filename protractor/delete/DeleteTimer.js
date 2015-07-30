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
var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Timer', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Timer";
    var ITEM_TYPE = "timer";
    var ITEM_MENU_GLYPH = 'õ\nTimer';
    var ITEM_GRID_SELECT = 'P\nõ\nTimer';
    var ITEM_SIDE_SELECT = "õ\nTimer"
    beforeEach(require('../common/Launch'));
    it('should delete the Timer', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });

});
