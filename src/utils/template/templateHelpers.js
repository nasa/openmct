export function convertTemplateToHTML(templateString) {
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

export function toggleClass(element, className) {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    element.classList.add(className);
  }
}
