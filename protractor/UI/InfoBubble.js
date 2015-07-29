var fullScreenFile = require("../common/Buttons");
var createItem = require("../common/CreateItem")
var itemEdit = require("../common/EditItem");
var rightMenu = require("../common/RightMenu");
var Drag = require("../common/drag");

describe('Test Info Bubble', function() {
    var fullScreenClass = new fullScreenFile();
    var createClass = new createItem();
    var editItemClass = new itemEdit();
    var rightMenuClass = new rightMenu();
    var dragDrop = new Drag();

    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(4000);  // 4 seconds
    });
    it('should detect info bubble', function(){
        var myitem = (element.all(by.repeater('child in composition'))).get(0);
        browser.actions().mouseMove(myitem).perform();
        browser.sleep(4000);
        expect(element(by.css('.t-infobubble.s-infobubble.l-infobubble-wrapper')).isDisplayed()).toBe(true);
    });
});