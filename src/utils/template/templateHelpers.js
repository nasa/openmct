/**
 * Converts a template string to an array of HTML elements.
 *
 * @param {string} templateString - The template string to convert.
 * @returns {HTMLElement[]} An array of HTML elements.
 */
function convertTemplateToHTML(templateString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(templateString, 'text/html');

  // Create a document fragment to hold the parsed content
  const fragment = document.createDocumentFragment();

  // Append nodes from the parsed content to the fragment
  while (doc.body.firstChild) {
    fragment.appendChild(doc.body.firstChild);
  }

  // Convert children of the fragment to an array and return
  return Array.from(fragment.children);
}

/**
 * Toggles a CSS class on an element.
 *
 * @param {HTMLElement} element - The element to toggle the class on.
 * @param {string} className - The class name to toggle.
 * @returns {void}
 */
function toggleClass(element, className) {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    element.classList.add(className);
  }
}

export { convertTemplateToHTML, toggleClass };
