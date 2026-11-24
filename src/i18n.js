function t(key, substitutions) {
  return browser.i18n.getMessage(key, substitutions) || key;
}

function applyI18n() {
  document.documentElement.lang = browser.i18n.getUILanguage();
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  }
}

applyI18n();
