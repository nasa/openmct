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
 *****************************************************************************/

import TextHighlight from './TextHighlight.vue';

describe('TextHighlight', () => {
  function render(text, highlight) {
    const ctx = { text, highlight, highlightClass: 'highlight' };
    return TextHighlight.computed.highlightedText.call(ctx);
  }

  it('highlights plain text', () => {
    expect(render('hello world', 'world')).toBe(
      'hello <span class="highlight">world</span>'
    );
  });

  it('does not throw on search text with regex characters (#8432)', () => {
    let result;
    expect(() => {
      result = render('note (a) here', '(a');
    }).not.toThrow();
    expect(result).toContain('<span class="highlight">(a</span>');
  });

  it('does not throw on unclosed character classes (#8432)', () => {
    let result;
    expect(() => {
      result = render('a [unclosed entry', '[unclosed');
    }).not.toThrow();
    expect(result).toContain('<span class="highlight">[unclosed</span>');
  });
});
