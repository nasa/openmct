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
import { createSafeRegExp } from './safeRegExp.js';

const PATTERNS_THAT_DO_NOT_COMPILE = ['(', '[', '*', '\\', '(?<', 'a{2,1}'];

const NESTED_REPETITION_PATTERNS = [
  '(a+)+$',
  '^(a+)+$',
  '(a*)*',
  '(a+)*',
  '(a*)+',
  '(\\d+)+',
  '(x+x+)+y',
  '([a-z]+\\s*)+',
  '((a+)?)+',
  '(a{1,3})+',
  '(?:a+)+',
  '(?:(a+))+',
  '(a+|b)+'
];

const ACCEPTABLE_PATTERNS = [
  'a+b+',
  '(a)+',
  '(foo|bar)+',
  '[a-z]+',
  '\\d{2,}',
  '(a{1})+',
  '(a?)+',
  '(a+)?',
  '(a+)(b)+',
  '^\\s*\\S+\\s*$',
  '(a{)+',
  '\\(a+\\)+',
  '[(]a+[)]+',
  '(a\\+)+',
  '(a[+])+',
  '([^)]+)',
  '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
];

describe('createSafeRegExp', () => {
  it('returns a usable RegExp for an ordinary pattern', () => {
    const regExp = createSafeRegExp('^-?[0-9]+(\\.[0-9]+)?$');

    expect(regExp).toEqual(/^-?[0-9]+(\.[0-9]+)?$/);
    expect(regExp.test('-12.5')).toBe(true);
    expect(regExp.test('12.5.5')).toBe(false);
  });

  it('passes flags through to the RegExp', () => {
    expect(createSafeRegExp('^a$', 'm')).toEqual(/^a$/m);
  });

  it('returns undefined for a pattern that will not compile', () => {
    PATTERNS_THAT_DO_NOT_COMPILE.forEach((pattern) => {
      expect(createSafeRegExp(pattern)).withContext(`pattern: ${pattern}`).toBeUndefined();
    });
  });

  it('returns undefined for a pattern that repeats a group containing a repetition', () => {
    NESTED_REPETITION_PATTERNS.forEach((pattern) => {
      // Every one of these compiles without complaint. What they cost to run
      // against a value that very nearly matches is the problem.
      expect(() => new RegExp(pattern))
        .withContext(`pattern: ${pattern}`)
        .not.toThrow();

      expect(createSafeRegExp(pattern)).withContext(`pattern: ${pattern}`).toBeUndefined();
    });
  });

  it('accepts patterns whose repetition is not nested', () => {
    ACCEPTABLE_PATTERNS.forEach((pattern) => {
      expect(createSafeRegExp(pattern))
        .withContext(`pattern: ${pattern}`)
        .toEqual(new RegExp(pattern));
    });
  });

  it('rejects a pattern without ever running it', () => {
    // A guard that decided by timing how long the pattern takes would already
    // have paid the cost it is meant to avoid.
    const startedAt = performance.now();

    expect(createSafeRegExp('(a+)+$')).toBeUndefined();
    expect(performance.now() - startedAt).toBeLessThan(50);
  });
});
