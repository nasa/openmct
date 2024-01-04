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
// Set of connection states
const CONNECTED = {
  statusClass: 's-status-on'
};
const PENDING = {
  statusClass: 's-status-warning-lo'
};
const DISCONNECTED = {
  statusClass: 's-status-warning-hi'
};

/**
 * URLIndicator class for monitoring and displaying the connection status of a URL.
 */
class URLIndicator {
  /**
   * Create a URLIndicator.
   * @param {Object} options - Configuration options for the URLIndicator.
   * @param {Object} simpleIndicator - The indicator object used for display.
   */
  constructor(options, simpleIndicator) {
    this.bindMethods();
    this.count = 0;

    this.indicator = simpleIndicator;
    this.setDefaultsFromOptions(options);
    this.setIndicatorToState(PENDING);

    this.fetchUrl();
    setInterval(this.fetchUrl, this.interval);
  }

  /**
   * Binds methods to the instance context.
   */
  bindMethods() {
    this.fetchUrl = this.fetchUrl.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);
    this.handleError = this.handleError.bind(this);
    this.setIndicatorToState = this.setIndicatorToState.bind(this);
  }

  /**
   * Sets the indicator to a specified state.
   * @param {Object} state - The state to set the indicator to.
   */
  setIndicatorToState(state) {
    switch (state) {
      case CONNECTED:
        this.indicator.text(this.label + ' is connected');
        this.indicator.description(
          this.label + ' is online, checking status every ' + this.interval + ' milliseconds.'
        );
        break;

      case PENDING:
        this.indicator.text('Checking status of ' + this.label + ' please stand by...');
        this.indicator.description('Checking status of ' + this.label + ' please stand by...');
        break;

      case DISCONNECTED:
        this.indicator.text(this.label + ' is offline');
        this.indicator.description(
          this.label + ' is offline, checking status every ' + this.interval + ' milliseconds'
        );
        break;
    }

    this.indicator.statusClass(state.statusClass);
  }

  /**
   * Fetches the URL and sets the indicator state based on the response.
   */
  fetchUrl() {
    fetch(this.URLpath)
      .then((response) => {
        if (response.ok) {
          this.handleSuccess();
        } else {
          this.handleError();
        }
      })
      .catch(() => {
        this.handleError();
      });
  }

  /**
   * Handles errors in fetching the URL.
   */
  handleError() {
    this.setIndicatorToState(DISCONNECTED);
  }

  /**
   * Handles successful fetching of the URL.
   */
  handleSuccess() {
    this.setIndicatorToState(CONNECTED);
  }

  /**
   * Sets default values from options.
   * @param {Object} options - The options to set defaults from.
   */
  setDefaultsFromOptions(options) {
    this.URLpath = options.url;
    this.label = options.label || options.url;
    this.interval = options.interval || 10000;
    this.indicator.iconClass(options.iconClass || 'icon-chain-links');
  }
}

export default URLIndicator;
