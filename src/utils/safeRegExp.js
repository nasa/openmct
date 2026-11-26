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
 * Matches `{n}`, `{n,}` or `{n,m}` at the start of the string it is given. A
 * `{` that does not fit that shape is an ordinary character, not a quantifier.
 */
const BRACED_QUANTIFIER = /^\{(\d+)(?:,(\d*))?\}/;

/**
 * Finds the end of a character class, so that grouping and repetition
 * characters inside one — `[(]`, `[+]`, `[^)]` — are not mistaken for the real
 * thing.
 *
 * @param {string} pattern
 * @param {number} openIndex index of the opening `[`
 * @returns {number} index of the first character after the class
 */
function endOfCharacterClass(pattern, openIndex) {
  let index = openIndex + 1;

  while (index < pattern.length) {
    if (pattern[index] === '\\') {
      index += 2;
    } else if (pattern[index] === ']') {
      return index + 1;
    } else {
      index += 1;
    }
  }

  return pattern.length;
}

/**
 * @param {string} pattern
 * @param {number} index
 * @returns {number} index after a lazy modifier, if there is one
 */
function skipLazyModifier(pattern, index) {
  return pattern[index] === '?' ? index + 1 : index;
}

/**
 * Reads whatever quantifier sits at `index`.
 *
 * `?`, `{1}` and `{0,1}` are not counted as repetition. An atom that can match
 * at most once cannot multiply the number of ways the pattern as a whole can
 * match, so it cannot contribute to a backtracking blowup.
 *
 * @param {string} pattern
 * @param {number} index
 * @returns {{isRepetition: boolean, nextIndex: number}}
 */
function readQuantifier(pattern, index) {
  const character = pattern[index];

  if (character === '*' || character === '+') {
    return { isRepetition: true, nextIndex: skipLazyModifier(pattern, index + 1) };
  }

  if (character === '?') {
    return { isRepetition: false, nextIndex: skipLazyModifier(pattern, index + 1) };
  }

  if (character === '{') {
    const match = BRACED_QUANTIFIER.exec(pattern.slice(index));

    if (match !== null) {
      const [quantifier, minimum, maximum] = match;
      let largestCount;

      if (maximum === undefined) {
        largestCount = Number(minimum);
      } else if (maximum === '') {
        largestCount = Number.POSITIVE_INFINITY;
      } else {
        largestCount = Number(maximum);
      }

      return {
        isRepetition: largestCount > 1,
        nextIndex: skipLazyModifier(pattern, index + quantifier.length)
      };
    }
  }

  return { isRepetition: false, nextIndex: index };
}

/**
 * Reports whether `pattern` repeats a group that itself contains a repetition —
 * `(a+)+`, `(a*)*`, `([a-z]+\s*)+` and so on. Those patterns give the engine
 * exponentially many ways to divide the same input between the inner and outer
 * repetition, so a value that very nearly matches sends it through all of them.
 *
 * `pattern` is expected to have compiled already, so its groups and character
 * classes are balanced.
 *
 * @param {string} pattern
 * @returns {boolean}
 */
function repeatsARepetition(pattern) {
  const groups = [{ containsRepetition: false }];
  let index = 0;

  while (index < pattern.length) {
    const character = pattern[index];
    let closedGroup;
    let indexAfterAtom;

    if (character === '(') {
      groups.push({ containsRepetition: false });
      index += 1;
      continue;
    } else if (character === '|' || character === '^' || character === '$') {
      // Nothing can be repeated, so there is nothing to account for.
      index += 1;
      continue;
    } else if (character === ')') {
      closedGroup = groups.length > 1 ? groups.pop() : undefined;
      indexAfterAtom = index + 1;
    } else if (character === '\\') {
      indexAfterAtom = index + 2;
    } else if (character === '[') {
      indexAfterAtom = endOfCharacterClass(pattern, index);
    } else {
      indexAfterAtom = index + 1;
    }

    const { isRepetition, nextIndex } = readQuantifier(pattern, indexAfterAtom);
    const enclosingGroup = groups[groups.length - 1];

    if (closedGroup !== undefined) {
      if (isRepetition && closedGroup.containsRepetition) {
        return true;
      }

      if (isRepetition || closedGroup.containsRepetition) {
        enclosingGroup.containsRepetition = true;
      }
    } else if (isRepetition) {
      enclosingGroup.containsRepetition = true;
    }

    index = nextIndex;
  }

  return false;
}

/**
 * Compiles a regular expression from a pattern that came from outside Open MCT
 * — a telemetry table column filter, for instance — refusing any pattern that
 * could hang the thread that runs it.
 *
 * JavaScript offers no way to abandon a regular expression once it is running,
 * and no way to run one under a time limit, so the pattern has to be judged
 * before it is used. This applies the rule the `safe-regex` family of libraries
 * applies, without the dependency: reject a repetition applied to a group that
 * already contains a repetition.
 *
 * The rule is deliberately conservative, and it is not exhaustive. `(\d+,)+` is
 * rejected even though its `,` makes each iteration unambiguous and therefore
 * quick, and an ambiguous alternation such as `(a|a)*` is accepted even though
 * it takes over a minute against a thirty character value. Filtering user
 * patterns off the main thread is the only complete answer; this closes the
 * shapes that can be written by accident.
 *
 * @param {string} pattern a regular expression source, without delimiters
 * @param {string} [flags] regular expression flags
 * @returns {RegExp | undefined} the compiled expression, or undefined if the
 * pattern will not compile or was rejected
 */
export function createSafeRegExp(pattern, flags) {
  let regExp;

  try {
    regExp = new RegExp(pattern, flags);
  } catch (error) {
    return undefined;
  }

  if (repeatsARepetition(pattern)) {
    return undefined;
  }

  return regExp;
}
