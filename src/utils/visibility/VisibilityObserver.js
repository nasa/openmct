/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

/**
 * Optimizes `requestAnimationFrame` calls to only execute when the element is visible in the viewport.
 */
export default class VisibilityObserver {
  #element;
  #observer;
  #observingBegun;
  lastUnfiredFunc;

  /**
   * Constructs a VisibilityObserver instance to manage visibility-based requestAnimationFrame calls.
   *
   * @param {HTMLElement} element - The DOM element to observe for visibility changes.
   * @throws {Error} If element is not provided.
   */
  constructor(element) {
    if (!element) {
      throw new Error(`VisibilityObserver must be created with an element`);
    }
    console.debug(`🪞 VisibilityObserver: created`);
    this.#element = element;
    this.isIntersecting = true;
    this.calledOnce = false;
    this.observingBegun = false;
    const rootContainer = document.querySelector('.js-main-container');
    console.debug(`🪞 VisibilityObserver: root container ${rootContainer}`);
    const options = {
      root: rootContainer,
      rootMargin: '0px',
      threshold: 1.0
    };
    this.#observer = new IntersectionObserver(this.#observerCallback, options);
    this.lastUnfiredFunc = null;
    this.renderWhenVisible = this.renderWhenVisible.bind(this);
  }

  #observerCallback = ([entry]) => {
    // Log the element itself
    console.debug('🌲 Element:', this.#element);
    const serializedElement = `🌲 Element: ${this.#element.tagName}${
      this.#element.id ? '#' + this.#element.id : ''
    }${this.#element.className ? '.' + this.#element.className.split(' ').join('.') : ''}`;
    console.debug(serializedElement);
    let serializedChildren = '🌲Direct children:';
    // Log each direct child
    Array.from(this.#element.children).forEach((child, index) => {
      serializedChildren += `\n - Child ${index}: <${child.tagName.toLowerCase()}${
        child.id ? '#' + child.id : ''
      }${child.className ? ' class="' + child.className + '"' : ''}>`;
    });
    console.debug(`🌲 ${serializedChildren}`);
    if (entry.target === this.#element) {
      this.isIntersecting = entry.isIntersecting;
      console.debug(
        `🪞 VisibilityObserver changed visibility to ${entry.isIntersecting} with ${entry.intersectionRatio}`
      );
      if (!this.isIntersecting) {
        console.debug(`🪞 VisibilityObserver no longer intersecting`);
        this.#element.style.backgroundColor = 'cyan'; // Example bright background color
        this.#element.style.color = 'magenta'; // Example bright foreground color
        // Extract the properties of interest
        const entryInfo = {
          time: entry.time,
          rootBounds: entry.rootBounds ? entry.rootBounds.toJSON() : null, // Convert to plain object if available
          boundingClientRect: entry.boundingClientRect.toJSON(),
          intersectionRect: entry.intersectionRect.toJSON(),
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio
        };

        // Serialize to a JSON string
        const entryString = JSON.stringify(entryInfo, null, 2); // Pretty-print with 2 spaces indentation

        // For logging to the console or storing the serialized string
        console.debug(`🪩 ${entryString}`);
      }
      if (this.isIntersecting && this.lastUnfiredFunc) {
        window.requestAnimationFrame(this.lastUnfiredFunc);
        this.lastUnfiredFunc = null;
      }
    }
  };

  startObserving() {
    this.#observingBegun = true;
    console.debug(`🪞 VisibilityObserver: asking to start observing`);
  }

  /**
   * Executes a function within requestAnimationFrame if the observed element is visible.
   * If the element is not visible, the function is stored and called when the element becomes visible.
   * Note that if called multiple times while not visible, only the last execution is stored and executed.
   *
   * @param {Function} func - The function to execute.
   * @returns {boolean} True if the function was executed immediately, false otherwise.
   */
  renderWhenVisible(func) {
    if (!this.#observingBegun) {
      console.debug(`🪞 VisibilityObserver: not observing yet`);
      window.requestAnimationFrame(func);
      return true;
    } else if (!this.calledOnce) {
      this.calledOnce = true;
      this.#observer.observe(this.#element);
      console.debug(`🪞 VisibilityObserver: starting to observe`);
      window.requestAnimationFrame(func);
      return true;
    } else if (this.isIntersecting) {
      console.debug(`🪞 VisibilityObserver: intersecting - firing`);
      window.requestAnimationFrame(func);
      return true;
    } else {
      this.lastUnfiredFunc = func;
      return false;
    }
  }

  /**
   * Stops observing the element for visibility changes and cleans up resources to prevent memory leaks.
   */
  destroy() {
    console.debug(`🪞 VisibilityObserver: being destroyed`);
    this.#observer.disconnect();
    this.#element = null;
    this.isIntersecting = null;
    this.#observer = null;
    this.lastUnfiredFunc = null;
    this.calledOnce = false;
    this.observingBegun = false;
  }
}
