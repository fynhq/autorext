const form = document.getElementById("add-form");
const input = document.getElementById("domain");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const error = document.getElementById("error");

let domains = [];

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
}

function render() {
  list.textContent = "";
  empty.hidden = domains.length > 0;

  for (const domain of domains) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = domain;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = t("removeButton");
    remove.setAttribute("aria-label", t("removeLabel", domain));
    remove.addEventListener("click", () => removeDomain(domain));

    item.append(name, remove);
    list.append(item);
  }
}

async function persist() {
  await browser.storage.local.set({ [WHITELIST_KEY]: domains });
}

async function removeDomain(domain) {
  domains = domains.filter((item) => item !== domain);
  await persist();
  render();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const domain = normalizeDomain(input.value);
  if (!domain) {
    showError(t("errorInvalidDomain"));
    return;
  }

  showError("");
  if (!domains.includes(domain)) {
    domains = [...domains, domain].sort();
    await persist();
  }
  input.value = "";
  render();
  input.focus();
});

(async function init() {
  domains = await readWhitelist();
  render();
})();
