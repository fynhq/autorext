const hostElement = document.getElementById("host");
const toggle = document.getElementById("auto-toggle");
const note = document.getElementById("note");
const manage = document.getElementById("manage");

let hostname = "";
let whitelist = [];

function currentMatch() {
  return matchingWhitelistEntry(hostname, whitelist);
}

function render() {
  const match = currentMatch();
  const coveredByParent = match !== null && match !== hostname;
  toggle.checked = match === null;
  toggle.disabled = coveredByParent;
  toggle.closest("label").classList.toggle("disabled", coveredByParent);
  note.textContent = coveredByParent
    ? t("popupNoteCovered", match)
    : match === null
      ? t("popupNoteOn")
      : t("popupNoteWhitelisted");
}

toggle.addEventListener("change", async () => {
  whitelist = toggle.checked
    ? whitelist.filter((domain) => domain !== hostname)
    : [...whitelist, hostname].sort();
  await browser.storage.local.set({ [WHITELIST_KEY]: whitelist });
  render();
});

manage.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});

(async function init() {
  applyI18n();
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const pageUrl = isReaderUrl(tab?.url) ? articleUrl(tab.url) : tab?.url;
  hostname = hostnameFromUrl(pageUrl);

  if (!hostname) {
    hostElement.textContent = t("popupHostUnsupported");
    toggle.disabled = true;
    note.textContent = t("popupUnsupportedHint");
    return;
  }

  hostElement.textContent = hostname;
  whitelist = await readWhitelist();
  render();
})();
