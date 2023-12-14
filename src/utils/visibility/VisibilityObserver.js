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

/**
 * Optimizes `requestAnimationFrame` calls to only execute when the element is visible in the viewport.
 */
export default class VisibilityObserver {
  #element;
  #observer;
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
    this.#element = element;
    this.isIntersecting = true;

    this.#observer = new IntersectionObserver(this.#observerCallback);
    this.#observer.observe(this.#element);
    this.lastUnfiredFunc = null;
    this.renderWhenVisible = this.renderWhenVisible.bind(this);
  }

  #observerCallback = ([entry]) => {
    if (entry.target === this.#element) {
      this.isIntersecting = entry.isIntersecting;
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
   * @param {Function} func - The function to execute.
   * @returns {boolean} True if the function was executed immediately, false otherwise.
   */
  renderWhenVisible(func) {
    if (this.isIntersecting) {
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
    this.#observer.unobserve(this.#element);
    this.#element = null;
    this.isIntersecting = null;
    this.#observer = null;
    this.lastUnfiredFunc = null;
  }
}
