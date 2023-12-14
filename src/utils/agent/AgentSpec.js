/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import Agent from './Agent';

const TEST_USER_AGENTS = {
  DESKTOP:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36',
  IPAD: 'Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53',
  IPHONE:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53'
};

describe('The Agent', function () {
  let testWindow;
  let agent;

  beforeEach(function () {
    testWindow = {
      innerWidth: 640,
      innerHeight: 480,
      navigator: {
        userAgent: TEST_USER_AGENTS.DESKTOP
      }
    };
  });

  it('recognizes desktop devices as non-mobile', function () {
    testWindow.navigator.userAgent = TEST_USER_AGENTS.DESKTOP;
    agent = new Agent(testWindow);
    expect(agent.isMobile()).toBeFalsy();
    expect(agent.isPhone()).toBeFalsy();
    expect(agent.isTablet()).toBeFalsy();
  });

  it('detects iPhones', function () {
    testWindow.navigator.userAgent = TEST_USER_AGENTS.IPHONE;
    agent = new Agent(testWindow);
    expect(agent.isMobile()).toBeTruthy();
    expect(agent.isPhone()).toBeTruthy();
    expect(agent.isTablet()).toBeFalsy();
  });

  it('detects iPads', function () {
    testWindow.navigator.userAgent = TEST_USER_AGENTS.IPAD;
    agent = new Agent(testWindow);
    expect(agent.isMobile()).toBeTruthy();
    expect(agent.isPhone()).toBeFalsy();
    expect(agent.isTablet()).toBeTruthy();
  });

  it('detects display orientation by innerHeight and innerWidth', function () {
    agent = new Agent(testWindow);
    testWindow.innerWidth = 1024;
    testWindow.innerHeight = 400;
    expect(agent.isPortrait()).toBeFalsy();
    expect(agent.isLandscape()).toBeTruthy();
    testWindow.innerWidth = 400;
    testWindow.innerHeight = 1024;
    expect(agent.isPortrait()).toBeTruthy();
    expect(agent.isLandscape()).toBeFalsy();
  });

  it('detects display orientation by screen.orientation', function () {
    agent = new Agent(testWindow);
    testWindow.screen = {
      orientation: {
        type: 'landscape-primary'
      }
    };
    expect(agent.isPortrait()).toBeFalsy();
    expect(agent.isLandscape()).toBeTruthy();
    testWindow.screen = {
      orientation: {
        type: 'portrait-primary'
      }
    };
    expect(agent.isPortrait()).toBeTruthy();
    expect(agent.isLandscape()).toBeFalsy();
  });

  it('detects display orientation by window.orientation', function () {
    agent = new Agent(testWindow);
    testWindow.orientation = 90;
    expect(agent.isPortrait()).toBeFalsy();
    expect(agent.isLandscape()).toBeTruthy();
    testWindow.orientation = 0;
    expect(agent.isPortrait()).toBeTruthy();
    expect(agent.isLandscape()).toBeFalsy();
  });

  it('detects touch support', function () {
    testWindow.ontouchstart = null;
    expect(new Agent(testWindow).isTouch()).toBe(true);
    delete testWindow.ontouchstart;
    expect(new Agent(testWindow).isTouch()).toBe(false);
  });

  it('allows for checking browser type', function () {
    testWindow.navigator.userAgent = 'Chromezilla Safarifox';
    agent = new Agent(testWindow);
    expect(agent.isBrowser('Chrome')).toBe(true);
    expect(agent.isBrowser('Firefox')).toBe(false);
  });
});
