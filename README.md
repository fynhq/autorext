<a id="english"></a>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/icons/logo-white-1024.png">
    <img src="src/icons/logo-black-1024.png" alt="AutoR logo" width="128" />
  </picture>
</p>

# AutoR

**Articles open. Quiet follows.**

AutoR opens supported article pages in Firefox's built-in Reader Mode. It adds a per-site whitelist, a toolbar toggle, and a keyboard shortcut. Firefox 140+ desktop only; no data collection or network requests.

English | [中文](#chinese)

## Install

The AMO listing will be linked here after the first release.

## Usage

- Reader Mode opens automatically on supported articles unless the site is whitelisted.
- Use the toolbar popup to toggle the current site or manage the whitelist; `Ctrl+Alt+R` (Windows/Linux) or `Control+Command+R` (macOS) toggles manually at any time.
- Adding `example.com` covers its subdomains; the most specific whitelist entry wins.
- Pressing Back from an auto-opened Reader page returns to the previous page. If the article was the tab's first page, the tab is closed unless pinned.
- Settings stay local; there is no account, telemetry, or cloud service.

## Permissions and privacy

- `tabs` — read the tab URL and `isArticle`, toggle Reader Mode, navigate back, or close tabs.
- `webNavigation` — detect navigation and back events so Reader Mode is not reopened after leaving it.
- `storage` — store the whitelist locally and per-tab state in session storage.

No host permissions, no content scripts, no network requests. The manifest declares `data_collection_permissions.required = ["none"]`.

## Build

Requires Node.js and Firefox 140+.

```sh
npx web-ext lint --source-dir src
npx web-ext run --source-dir src
npx web-ext build --source-dir src --overwrite-dest
```

The ZIP is written to `web-ext-artifacts/` with `manifest.json` at its root. There is no build or transpile step.

## License

Released under the MIT License. See [LICENSE](LICENSE).

---

<a id="chinese"></a>

# AutoR

**文章自开，静读自来。**

AutoR 在 Firefox 识别出的文章页自动打开内置阅读模式，并提供按域名白名单、工具栏开关和快捷键。仅支持 Firefox 140+ 桌面版；不收集数据，不发起网络请求。

[English](#english) | 中文

## 安装

首个版本发布后，这里会补上 AMO 链接。

## 使用

- 支持的文章页会自动打开阅读模式；白名单站点会跳过。
- 用工具栏弹窗开关当前站点或管理白名单；`Ctrl+Alt+R`（Windows/Linux）或 `Control+Command+R`（macOS）可随时手动切换。
- 添加 `example.com` 会覆盖其子域名；更具体的白名单条目优先。
- 自动打开阅读模式后按“后退”会回到上一页；如果文章是标签页第一页，则关闭该标签页（固定标签页除外）。
- 所有设置保存在本地；没有账号、遥测或云服务。

## 权限与隐私

- `tabs` — 读取标签页 URL 和 `isArticle`，切换阅读模式，前进/后退或关闭标签页。
- `webNavigation` — 检测导航和后退事件，避免离开阅读模式后又被自动打开。
- `storage` — 本地保存白名单，并在会话存储中保存标签页状态。

不申请主机权限，不注入内容脚本，不发起网络请求。manifest 中声明 `data_collection_permissions.required = ["none"]`。

## 构建

需要 Node.js 和 Firefox 140+。

```sh
npx web-ext lint --source-dir src
npx web-ext run --source-dir src
npx web-ext build --source-dir src --overwrite-dest
```

ZIP 输出到 `web-ext-artifacts/`，根目录包含 `manifest.json`。项目没有构建或转译步骤。

## 许可

基于 MIT 许可发布，见 [LICENSE](LICENSE)。
