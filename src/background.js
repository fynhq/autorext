const STORAGE_KEY = "tabState";

const AUTO_OPEN_DELAY_MS = 250;
const RECHECK_DELAY_MS = 1200;
const RETRY_DELAY_MS = 1500;

const pendingAutoOpen = new Map();

const META_KEY = "tabMeta";
const SKIP_SUPPRESS_MS = 3000;
const STARTUP_GRACE_MS = 30000;

let metaPromise = browser.storage.session
  .get(META_KEY)
  .then((stored) => stored[META_KEY] ?? {})
  .catch(() => ({}));

let startupAt = 0;
browser.runtime.onStartup.addListener(() => {
  startupAt = Date.now();
});

const EMPTY_STATE = Object.freeze({ handledUrl: null, readerUrl: null });

let statesPromise = browser.storage.session
  .get(STORAGE_KEY)
  .then((stored) => stored[STORAGE_KEY] ?? {})
  .catch(() => ({}));

let workQueue = Promise.resolve();

function enqueue(task) {
  workQueue = workQueue
    .then(task)
    .catch((error) => console.error("auto-reader:", error));
  return workQueue;
}

function getTabState(states, tabId) {
  return states[tabId] ?? EMPTY_STATE;
}

async function saveState(states) {
  try {
    await browser.storage.session.set({ [STORAGE_KEY]: states });
  } catch (error) {
    console.error("auto-reader:", error);
  }
}

async function commitState(states, tabId, state) {
  if (state.handledUrl === null && state.readerUrl === null) {
    if (!(tabId in states)) {
      return;
    }
    delete states[tabId];
  } else {
    states[tabId] = state;
  }
  await saveState(states);
}

function getMeta(metas, tabId) {
  return (metas[tabId] ??= {
    tracked: false,
    firstUrl: null,
    skipOnBack: null,
    suppressSkipUntil: 0,
    maybeRestored: false,
  });
}

async function saveMeta(metas) {
  try {
    await browser.storage.session.set({ [META_KEY]: metas });
  } catch (error) {
    console.error("auto-reader:", error);
  }
}

function scheduleAutoOpen(tabId, url, delay) {
  const pending = pendingAutoOpen.get(tabId);
  if (pending?.url === url) {
    return;
  }
  if (pending) {
    clearTimeout(pending.timer);
  }
  const timer = setTimeout(() => {
    pendingAutoOpen.delete(tabId);
    enqueue(() => attemptAutoOpen(tabId, url));
  }, delay);
  pendingAutoOpen.set(tabId, { url, timer });
}

async function attemptAutoOpen(tabId, url) {
  let tab;
  try {
    tab = await browser.tabs.get(tabId);
  } catch {
    return;
  }
  if (tab.status !== "complete" || tab.url !== url || tab.isArticle !== true) {
    return;
  }

  const states = await statesPromise;
  const state = { ...getTabState(states, tabId) };
  if (state.handledUrl !== null || state.readerUrl !== null) {
    return;
  }
  if (!(await isAutoOpenAllowed(url))) {
    return;
  }

  state.handledUrl = url;
  await commitState(states, tabId, state);
  const metas = await metaPromise;
  const meta = getMeta(metas, tabId);
  meta.skipOnBack = url;
  meta.suppressSkipUntil = 0;
  await saveMeta(metas);
  await toggleReaderMode(tabId, url, 1);
}

async function toggleReaderMode(tabId, url, retriesLeft) {
  try {
    await browser.tabs.toggleReaderMode(tabId);
  } catch (error) {
    console.warn("auto-reader: failed to enable reader mode", error);
    if (retriesLeft > 0) {
      setTimeout(() => {
        enqueue(() => retryToggleReaderMode(tabId, url, retriesLeft - 1));
      }, RETRY_DELAY_MS);
    }
  }
}

async function retryToggleReaderMode(tabId, url, retriesLeft) {
  let tab;
  try {
    tab = await browser.tabs.get(tabId);
  } catch {
    return;
  }
  const states = await statesPromise;
  const state = getTabState(states, tabId);
  if (
    tab.status !== "complete" ||
    tab.url !== url ||
    tab.isArticle !== true ||
    state.handledUrl !== url ||
    state.readerUrl !== null
  ) {
    return;
  }
  await toggleReaderMode(tabId, url, retriesLeft);
}

async function handleCommitted(details) {
  const metas = await metaPromise;
  const meta = metas[details.tabId];
  if (!meta) {
    return;
  }

  if (meta.tracked && meta.firstUrl === null && /^https?:/.test(details.url)) {
    meta.firstUrl = details.url;
    await saveMeta(metas);
  }

  const articleUrl = meta.skipOnBack;
  if (articleUrl === null || isReaderUrl(details.url)) {
    return;
  }

  meta.skipOnBack = null;
  const suppressed = meta.suppressSkipUntil > Date.now();
  meta.suppressSkipUntil = 0;
  await saveMeta(metas);

  if (
    suppressed ||
    !sameDocument(details.url, articleUrl) ||
    !(details.transitionQualifiers ?? []).includes("forward_back")
  ) {
    return;
  }

  if (
    meta.tracked &&
    !meta.maybeRestored &&
    meta.firstUrl !== null &&
    sameDocument(meta.firstUrl, articleUrl)
  ) {
    const tab = await browser.tabs.get(details.tabId).catch(() => null);
    if (tab && !tab.pinned) {
      await browser.tabs.remove(details.tabId);
      return;
    }
  }

  try {
    await browser.tabs.goBack(details.tabId);
  } catch (error) {
    console.warn("auto-reader: failed to skip the article page", error);
  }
}

async function handleUpdate(tabId, changeInfo, tab) {
  const states = await statesPromise;
  const state = { ...getTabState(states, tabId) };
  const url = tab.url ?? "";
  let dirty = false;

  if (changeInfo.url) {
    if (isReaderUrl(changeInfo.url)) {
      state.readerUrl = articleUrl(changeInfo.url);
      dirty = true;
    } else if (state.readerUrl !== null) {
      const closedReader = sameDocument(changeInfo.url, state.readerUrl);
      state.readerUrl = null;
      state.handledUrl = closedReader ? changeInfo.url : null;
      dirty = true;
    } else if (state.handledUrl !== null) {
      if (!sameDocument(changeInfo.url, state.handledUrl)) {
        state.handledUrl = null;
        dirty = true;
      }
    }
  }

  const eligible =
    tab.status === "complete" &&
    /^https?:/.test(url) &&
    !isReaderUrl(url) &&
    (state.handledUrl === null || !sameDocument(state.handledUrl, url));

  if (eligible) {
    scheduleAutoOpen(
      tabId,
      url,
      tab.isArticle === true ? AUTO_OPEN_DELAY_MS : RECHECK_DELAY_MS
    );
  }

  if (dirty) {
    await commitState(states, tabId, state);
  }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  enqueue(() => handleUpdate(tabId, changeInfo, tab));
});

browser.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) {
    return;
  }
  enqueue(() => handleCommitted(details));
});

browser.tabs.onCreated.addListener((tab) => {
  if (tab.id === undefined) {
    return;
  }
  enqueue(async () => {
    const metas = await metaPromise;
    metas[tab.id] = {
      tracked: true,
      firstUrl: null,
      skipOnBack: null,
      suppressSkipUntil: 0,
      maybeRestored: startupAt !== 0 && Date.now() - startupAt < STARTUP_GRACE_MS,
    };
    await saveMeta(metas);
  });
});

browser.tabs.onRemoved.addListener((tabId) => {
  enqueue(async () => {
    const pending = pendingAutoOpen.get(tabId);
    if (pending) {
      clearTimeout(pending.timer);
      pendingAutoOpen.delete(tabId);
    }
    const metas = await metaPromise;
    if (tabId in metas) {
      delete metas[tabId];
      await saveMeta(metas);
    }
    const states = await statesPromise;
    if (tabId in states) {
      delete states[tabId];
      await saveState(states);
    }
  });
});

async function toggleReader(tab) {
  if (!tab) {
    [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  }
  if (!tab || tab.id === undefined) {
    return;
  }

  const states = await statesPromise;
  const leavingReader = isReaderUrl(tab.url);
  const metas = await metaPromise;
  const meta = getMeta(metas, tab.id);
  if (leavingReader) {
    meta.suppressSkipUntil = Date.now() + SKIP_SUPPRESS_MS;
  } else {
    meta.skipOnBack = null;
  }
  await saveMeta(metas);
  const handledUrl = leavingReader ? articleUrl(tab.url) : tab.url;
  await commitState(states, tab.id, {
    ...getTabState(states, tab.id),
    handledUrl: handledUrl ?? null,
  });

  await browser.tabs.toggleReaderMode(tab.id);
}

browser.commands.onCommand.addListener((command, tab) => {
  if (command !== "toggle-reader") {
    return;
  }
  enqueue(() => toggleReader(tab));
});
