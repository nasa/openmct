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
//drag function
/*
var e = document.createEvent("Event");
e.initEvent('dragstart',true,false);
_element.dispatchEvent(e);
*/
// qux.js
var Drag = (function () {

	function Drag() {};	
	Drag.prototype.DragDrop = function(elem, zone){
		createEvent = function(type) {
		    var event = document.createEvent("event");
		    event.initEvent(type, true, false);
		    event.dataTransfer = {
			    data: {
			    },
			    setData: function(type, val){
			        event.dataTransfer.data[type] = val;
			    },
			    getData: function(type){
			        return event.dataTransfer.data[type];
			    }
		    };
		    return event;
		}
		var event = createEvent('dragstart');
        event.effectAllowed = "copyMove";
		elem.dispatchEvent(event);
        
		var ele = createEvent('dragover');
        ele.preventDefault();
        zone.dispatchEvent(ele);
        
		var dropEvent = createEvent('drop', {});
		dropEvent.dataTransfer = event.dataTransfer;
		dropEvent.preventDefault();
        zone.dispatchEvent(dropEvent);	
        
		var dragEndEvent = createEvent('dragend', {});
		dragEndEvent.dataTransfer = event.dataTransfer;
		elem.dispatchEvent(dragEndEvent);		
	};
	return Drag;
})();
module.exports = Drag;



