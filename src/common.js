const WHITELIST_KEY = "whitelist";

function isReaderUrl(url) {
  return typeof url === "string" && url.startsWith("about:reader?");
}

function articleUrl(readerUrl) {
  try {
    return new URL(readerUrl).searchParams.get("url") ?? readerUrl;
  } catch {
    return readerUrl;
  }
}

function stripFragment(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.href;
  } catch {
    return url;
  }
}

function sameDocument(a, b) {
  return stripFragment(a) === stripFragment(b);
}

function canonicalHostname(hostname) {
  return hostname.toLowerCase().replace(/\.$/, "");
}

function normalizeDomain(input) {
  if (typeof input !== "string") {
    return "";
  }
  const value = input.trim();
  if (!value) {
    return "";
  }
  try {
    const parsed = new URL(value.includes("://") ? value : `http://${value}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    const hostname = canonicalHostname(parsed.hostname);
    return /[\s*]/.test(hostname) ? "" : hostname;
  } catch {
    return "";
  }
}

function hostnameFromUrl(url) {
  if (typeof url !== "string") {
    return "";
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return canonicalHostname(parsed.hostname);
  } catch {
    return "";
  }
}

function matchingWhitelistEntry(hostname, domains) {
  if (!hostname || !Array.isArray(domains)) {
    return null;
  }
  let match = null;
  for (const domain of domains) {
    if (
      (hostname === domain || hostname.endsWith(`.${domain}`)) &&
      (match === null || domain.length > match.length)
    ) {
      match = domain;
    }
  }
  return match;
}

async function readWhitelist() {
  const stored = await browser.storage.local.get(WHITELIST_KEY);
  const list = Array.isArray(stored[WHITELIST_KEY]) ? stored[WHITELIST_KEY] : [];
  return [...new Set(list.map(normalizeDomain).filter(Boolean))].sort();
}

async function isAutoOpenAllowed(url) {
  const hostname = hostnameFromUrl(url);
  if (!hostname) {
    return true;
  }
  return matchingWhitelistEntry(hostname, await readWhitelist()) === null;
}
