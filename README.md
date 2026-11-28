<a id="english"></a>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-white-1024.png">
    <img src="assets/logo-black-1024.png" alt="AutoR logo" width="128" />
  </picture>
</p>

# AutoR

**Articles open. Quiet follows.**

AutoR opens supported article pages in Firefox's built-in Reader Mode. It adds a per-site exception list, a toolbar toggle, and a keyboard shortcut. Firefox 140+ desktop only; no data collection or network requests.

English | [中文](#chinese)

## Install

**From addons.mozilla.org** — [AutoR on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/autor/)

## Usage

- Reader Mode opens automatically on supported articles unless the site is in the exceptions.
- Use the toolbar popup to toggle the current site or manage the exceptions; `Ctrl+Alt+R` (`Ctrl+Cmd+R` on macOS) toggles manually at any time.
- Adding `example.com` covers its subdomains; the most specific exception wins.
- Pressing Back from an auto-opened Reader page returns to the previous page. If the article was the tab's first page, the tab is closed unless pinned.
- Settings stay local; there is no account, telemetry, or cloud service.

## Permissions

- `tabs` — read the tab URL and `isArticle`, toggle Reader Mode, navigate back, or close tabs.
- `webNavigation` — detect navigation and back events so Reader Mode is not reopened after leaving it.
- `storage` — store the exception list locally and per-tab state in session storage.

## Privacy

AutoR does not collect or transmit personal data. The manifest declares:

```json
"data_collection_permissions": {
  "required": ["none"]
}
```

The exception list stays in local storage. There are no host permissions, no content scripts, and no network requests.

## Build from source

`src/` is the extension; there is no build or transpile step. Node.js is only needed for `web-ext`.

```sh
npx web-ext@10 lint --source-dir src
npx web-ext@10 run --source-dir src
npx web-ext@10 build --source-dir src --overwrite-dest
```

Packages are written to `web-ext-artifacts/`.

## License

Released under the MIT License. See [LICENSE](LICENSE).

---

<a id="chinese"></a>

# AutoR

**文章自开，静读自来。**

AutoR 在 Firefox 识别出的文章页自动打开内置阅读模式，并提供按域名例外列表、工具栏开关和快捷键。仅支持 Firefox 140+ 桌面版；不收集数据，不发起网络请求。

[English](#english) | 中文

## 安装

**从 addons.mozilla.org 安装** — [Firefox 附加组件商店上的 AutoR](https://addons.mozilla.org/zh-CN/firefox/addon/autor/)

## 使用

- 支持的文章页会自动打开阅读模式；列入例外的站点会跳过。
- 用工具栏弹窗开关当前站点或管理例外列表；`Ctrl+Alt+R`（macOS 为 `Ctrl+Cmd+R`）可随时手动切换。
- 添加 `example.com` 会覆盖其子域名；更具体的例外条目优先。
- 自动打开阅读模式后按“后退”会回到上一页；如果文章是标签页第一页，则关闭该标签页（固定标签页除外）。
- 所有设置保存在本地；没有账号、遥测或云服务。

## 权限

- `tabs` — 读取标签页 URL 和 `isArticle`，切换阅读模式，前进/后退或关闭标签页。
- `webNavigation` — 检测导航和后退事件，避免离开阅读模式后又被自动打开。
- `storage` — 本地保存例外列表，并在会话存储中保存标签页状态。

## 隐私

AutoR 不收集、不上传个人数据。manifest 中声明：

```json
"data_collection_permissions": {
  "required": ["none"]
}
```

例外列表只保存在本地存储中。扩展不申请主机权限，不注入内容脚本，不发起网络请求。

## 从源码构建

`src/` 就是扩展本身，没有构建或转译步骤。Node.js 仅用于 `web-ext`。

```sh
npx web-ext@10 lint --source-dir src
npx web-ext@10 run --source-dir src
npx web-ext@10 build --source-dir src --overwrite-dest
```

打包结果输出到 `web-ext-artifacts/`。

## 许可

基于 MIT 许可发布，见 [LICENSE](LICENSE)。
