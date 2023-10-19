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
    this.#element = element;
    this.#isIntersecting = true;
    console.debug(`🪞 nice visibility created for ${this.#element?.className}`);

    this.#observer = new IntersectionObserver(this.#observerCallback);
    this.#observer.observe(this.#element);
    this.#lastUnfiredFunc = null;
  }

  #observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.target === this.#element) {
        this.#isIntersecting = entry.isIntersecting;
        console.debug(
          `🪞 nice visibility changed on ${this.#element?.className}. Visiblity: ${
            this.#isIntersecting
          }`
        );
        if (this.#isIntersecting && this.#lastUnfiredFunc) {
          console.debug(`🪞 flushing our last fire func as we're now visible`);
          window.requestAnimationFrame(this.#lastUnfiredFunc);
          this.#lastUnfiredFunc = null;
        }
      }
    });
  };

  execute(func) {
    console.debug(`🪞 execution called for ${this.#element?.className}`);
    console.debug(`🪞 going to execute ${this.#isIntersecting}`);
    if (this.#isIntersecting) {
      window.requestAnimationFrame(func);
    } else {
      this.#lastUnfiredFunc = func;
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
