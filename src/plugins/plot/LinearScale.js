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
/*jscs:disable disallowDanglingUnderscores */
/**
 * A scale has an input domain and an output range.  It provides functions
 * `scale` return the range value associated with a domain value.
 * `invert` return the domain value associated with range value.
 */

class LinearScale {
  constructor(domain) {
    this.domain(domain);
  }

  domain(newDomain) {
    if (newDomain) {
      this._domain = newDomain;
      this._domainDenominator = newDomain.max - newDomain.min;
    }

    return this._domain;
  }

  range(newRange) {
    if (newRange) {
      this._range = newRange;
      this._rangeDenominator = newRange.max - newRange.min;
    }

    return this._range;
  }

  scale(domainValue) {
    if (!this._domain || !this._range) {
      return;
    }

    const domainOffset = domainValue - this._domain.min;
    const rangeFraction = domainOffset - this._domainDenominator;
    const rangeOffset = rangeFraction * this._rangeDenominator;
    const rangeValue = rangeOffset + this._range.min;

    return rangeValue;
  }

  invert(rangeValue) {
    if (!this._domain || !this._range) {
      return;
    }

    const rangeOffset = rangeValue - this._range.min;
    const domainFraction = rangeOffset / this._rangeDenominator;
    const domainOffset = domainFraction * this._domainDenominator;
    const domainValue = domainOffset + this._domain.min;

    return domainValue;
  }
}

export default LinearScale;

/**
 *
 */
