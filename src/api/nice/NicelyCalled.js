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
export default class NicelyCalled {
  #element;
  #isIntersecting;
  #observer;
  #lastUnfiredFunc;

  constructor(element) {
    if (!element) {
      throw new Error(`Nice visibility must be created with an element`);
    }
    this.#element = element;
    this.#isIntersecting = true;

    this.#observer = new IntersectionObserver(this.#observerCallback);
    this.#observer.observe(this.#element);
    this.#lastUnfiredFunc = null;
  }

  #observerCallback = ([entry]) => {
    if (entry.target === this.#element) {
      this.#isIntersecting = entry.isIntersecting;
      if (this.#isIntersecting && this.#lastUnfiredFunc) {
        window.requestAnimationFrame(this.#lastUnfiredFunc);
        this.#lastUnfiredFunc = null;
      }
    }
  };

  execute(func) {
    if (this.#isIntersecting) {
      window.requestAnimationFrame(func);
      return true;
    } else {
      this.#lastUnfiredFunc = func;
      return false;
    }
  }

  destroy() {
    this.#observer.unobserve(this.#element);
    this.#element = null;
    this.#isIntersecting = null;
    this.#observer = null;
    this.#lastUnfiredFunc = null;
  }
}
