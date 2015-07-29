//TODO Add filter for duplications/
var fullScreenFile = require("../common/Buttons");

describe('Test Fullscreen', function() {
    var fullScreenClass = new fullScreenFile();
    
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(1000);
            browser.wait(function(){
                return element(by.css('[title="Enter full screen mode"]')).isPresent();
            }, 7000);
            browser.sleep(1000)
    });
    it('should find fullscreen button', function(){
        expect(element(by.css('[title="Enter full screen mode"]')).isDisplayed()).toBeTruthy();
          
    });it('should enter fullscreen when fullscreen button is pressed', function(){
        function getFullScreen(){
            return document.webkitIsFullScreen;
        }
        var fullscreen = browser.executeScript(getFullScreen)
        expect(fullscreen).toBeFalsy();
        fullScreenClass.fullScreen()
        fullscreen = browser.executeScript(getFullScreen)
        expect(fullscreen).toBeTruthy();  
    });
});