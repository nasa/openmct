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
class VisibilityObserver {
  /**
   * @type {HTMLElement | null}
   */
  #element;
  /**
   * @type {IntersectionObserver | null}
   */
  #observer;
  /**
   * @type {(() => void) | null}
   */
  lastUnfiredFunc;
  /**
   * @type {boolean | null}
   */
  isIntersecting;
  /**
   * @type {boolean}
   */
  calledOnce;

  /**
   * Constructs a VisibilityObserver instance to manage visibility-based requestAnimationFrame calls.
   *
   * @param {HTMLElement} element - The DOM element to observe for visibility changes.
   * @param {HTMLElement} rootContainer - The DOM element that is the root of the viewport.
   * @throws {Error} If element is not provided.
   */
  constructor(element, rootContainer) {
    if (!element || !rootContainer) {
      throw new Error(`VisibilityObserver must be created with an element and a rootContainer.`);
    }
    this.#element = element;
    this.isIntersecting = true;
    this.calledOnce = false;
    const options = {
      root: rootContainer
    };
    this.#observer = new IntersectionObserver(this.#observerCallback, options);
    this.lastUnfiredFunc = null;
    this.renderWhenVisible = this.renderWhenVisible.bind(this);
  }

  /**
   * @returns {boolean}
   */
  #inOverlay() {
    return this.#element?.closest('.js-overlay');
  }

  #observerCallback = (entries) => {
    const entry = entries[0];
    if (entry && entry.target === this.#element) {
      if (this.#inOverlay() && !entry.isIntersecting) {
        this.isIntersecting = true;
      } else {
        this.isIntersecting = entry.isIntersecting;
      }
      if (this.isIntersecting && this.lastUnfiredFunc) {
        window.requestAnimationFrame(this.lastUnfiredFunc);
        this.lastUnfiredFunc = null;
      }
    }
  };

  /**
   * Executes a function within requestAnimationFrame if the observed element is visible.
   * If the element is not visible, the function is stored and called when the element becomes visible.
   * Note that if called multiple times while not visible, only the last execution is stored and executed.
   *
   * @param {() => void} func - The function to execute.
   * @returns {boolean} True if the function was executed immediately, false otherwise.
   */
  renderWhenVisible(func) {
    if (!this.calledOnce) {
      this.calledOnce = true;
      if (!this.#observer || !this.#element) {
        this.lastUnfiredFunc = func;
        return false;
      }
      this.#observer.observe(this.#element);
    } else if (!this.isIntersecting) {
      this.lastUnfiredFunc = func;
      return false;
    }
    window.requestAnimationFrame(func);
    return true;
  }

  /**
   * Stops observing the element for visibility changes and cleans up resources to prevent memory leaks.
   */
  destroy() {
    if (this.#observer && this.#element) {
      this.#observer.unobserve(this.#element);
    }

    this.#element = null;
    this.isIntersecting = null;
    this.#observer = null;
    this.lastUnfiredFunc = null;
  }
}

export default VisibilityObserver;
