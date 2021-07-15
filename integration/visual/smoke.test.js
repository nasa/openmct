/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

//TODO Documentation
const VISUAL_WAIT = 1000;

describe('Smoke test suite', () => {
    it('about modal is visible', function () {
        cy.visit('/');
        cy.get('.l-shell__app-logo').click();
        cy.get('.c-about__image').should('be.visible');
        cy.wait(VISUAL_WAIT);
        cy.percySnapshot();
    });
    it('can create example imagery object', function () {
        cy.visit('/');
        cy.get('.c-create-button').click();
        cy.get('.c-menu').should('be.visible');
        cy.get('.icon-image').click();
        cy.get('.c-overlay__button-bar > .c-button--major').click();
        cy.get('.c-imagery__main-image__image').should('be.visible');
        cy.wait(VISUAL_WAIT);
        cy.percySnapshot();
    });
});
