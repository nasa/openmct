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
import { createDomainObjectWithDefaults } from '../../../appActions.js';
import { expect, test } from '../../../baseFixtures.js';

// We don't need cspell to check this. It doesn't know latin.
/* cSpell:disable */
const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Molestie at elementum eu facilisis sed. Feugiat pretium nibh ipsum consequat. Amet consectetur adipiscing elit duis tristique sollicitudin nibh sit amet. Eget nullam non nisi est sit amet. A pellentesque sit amet porttitor eget dolor morbi non arcu. Ullamcorper sit amet risus nullam eget felis eget nunc. In tellus integer feugiat scelerisque varius morbi enim nunc. Ac feugiat sed lectus vestibulum mattis ullamcorper. Nulla facilisi morbi tempus iaculis urna id volutpat. Massa vitae tortor condimentum lacinia quis vel eros donec. Ornare quam viverra orci sagittis eu. Vestibulum sed arcu non odio. In egestas erat imperdiet sed euismod nisi porta lorem. Vitae auctor eu augue ut lectus arcu bibendum at. Donec adipiscing tristique risus nec feugiat in fermentum posuere urna. Velit euismod in pellentesque massa placerat duis ultricies. Nulla facilisi nullam vehicula ipsum a arcu cursus vitae. Aliquam malesuada bibendum arcu vitae elementum curabitur.
Vel eros donec ac odio tempor orci. Et netus et malesuada fames ac turpis egestas sed tempus. Turpis egestas pretium aenean pharetra magna ac placerat. Euismod elementum nisi quis eleifend. Vitae auctor eu augue ut lectus arcu. At imperdiet dui accumsan sit amet nulla facilisi. Est velit egestas dui id ornare arcu odio ut sem. Ornare arcu dui vivamus arcu felis. Luctus venenatis lectus magna fringilla. At elementum eu facilisis sed. Tristique et egestas quis ipsum suspendisse ultrices gravida dictum. Enim eu turpis egestas pretium aenean pharetra magna ac placerat. Lobortis scelerisque fermentum dui faucibus in. Tempor orci eu lobortis elementum nibh tellus molestie nunc non. Dignissim convallis aenean et tortor at risus. Enim tortor at auctor urna nunc id cursus. Libero volutpat sed cras ornare arcu dui vivamus. Scelerisque fermentum dui faucibus in ornare quam viverra.
Odio ut sem nulla pharetra. Neque vitae tempus quam pellentesque nec. A arcu cursus vitae congue mauris. Turpis nunc eget lorem dolor sed viverra ipsum nunc aliquet. Nibh tellus molestie nunc non blandit massa enim nec. Risus feugiat in ante metus dictum at tempor commodo ullamcorper. Nec tincidunt praesent semper feugiat nibh sed pulvinar proin gravida. Pulvinar elementum integer enim neque. Bibendum ut tristique et egestas. Nibh praesent tristique magna sit. Lectus magna fringilla urna porttitor. Eu non diam phasellus vestibulum lorem sed risus. Rhoncus mattis rhoncus urna neque. Rutrum tellus pellentesque eu tincidunt tortor aliquam. Pharetra convallis posuere morbi leo urna molestie at elementum. Quis commodo odio aenean sed adipiscing. Enim sit amet venenatis urna cursus eget nunc.
Enim nec dui nunc mattis. Cursus turpis massa tincidunt dui ut. Donec adipiscing tristique risus nec feugiat in. Eleifend mi in nulla posuere sollicitudin. Donec enim diam vulputate ut pharetra sit. Ultricies mi eget mauris pharetra et ultrices neque. Eros in cursus turpis massa tincidunt dui. Cursus risus at ultrices mi tempus imperdiet nulla malesuada. Morbi enim nunc faucibus a pellentesque sit. Porttitor rhoncus dolor purus non. Ac tortor vitae purus faucibus.
Proin libero nunc consequat interdum varius sit amet mattis vulputate. Metus dictum at tempor commodo ullamcorper a lacus vestibulum sed. Quisque non tellus orci ac auctor augue mauris. Id ornare arcu odio ut. Rhoncus est pellentesque elit ullamcorper dignissim. Senectus et netus et malesuada fames ac turpis egestas. Volutpat ac tincidunt vitae semper quis lectus nulla. Adipiscing elit duis tristique sollicitudin. Ipsum faucibus vitae aliquet nec ullamcorper sit. Gravida neque convallis a cras semper auctor neque vitae tempus. Porttitor leo a diam sollicitudin tempor id. Dictum non consectetur a erat nam at lectus. At volutpat diam ut venenatis tellus in. Morbi enim nunc faucibus a pellentesque sit amet. Cursus in hac habitasse platea. Sed augue lacus viverra vitae.
`;

test.describe('Inspector tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Content in inspector can be scrolled to vertically', async ({ page }) => {
    const folderWithOverflowingTitle = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: loremIpsum
    });

    await page.goto(folderWithOverflowingTitle.url);

    const inspectorPropertiesLocator = page
      .getByRole('tabpanel', { name: 'Inspector Views' })
      .getByLabel('Inspector Properties Details');
    const inspectorPropertiesList = inspectorPropertiesLocator.getByRole('list');
    const firstInspectorPropertyValue = inspectorPropertiesList
      .getByRole('listitem')
      .first()
      .getByLabel('value', { exact: false });
    const lastInspectorPropertyValue = inspectorPropertiesList
      .getByRole('listitem')
      .last()
      .getByLabel('value', { exact: false });

    // inspector content partially in viewport, but not all the way in viewport
    await expect(inspectorPropertiesLocator).toBeInViewport();
    await expect(inspectorPropertiesLocator).not.toBeInViewport({ ratio: 0.9 });

    await expect(firstInspectorPropertyValue).toBeInViewport();
    await expect(lastInspectorPropertyValue).not.toBeInViewport();

    // using page.mouse.wheel to scroll the inspector content by the height of the content
    // because click and scrollIntoView will scroll even if scrollbar not available
    await inspectorPropertiesLocator.hover();
    const offset = await inspectorPropertiesLocator.evaluate((el) => el.offsetHeight);
    await page.mouse.wheel(0, offset);

    await expect(lastInspectorPropertyValue).toBeInViewport();
  });
});
