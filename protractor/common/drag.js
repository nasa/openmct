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



