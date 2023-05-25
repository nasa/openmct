export function convertTemplateToHTML(templateString) {
  const template = document.createElement('template');
  template.innerHTML = templateString;

  return template.content.cloneNode(true).children;
}

export function toggleClass(element, className) {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    element.classList.add(className);
  }
}
