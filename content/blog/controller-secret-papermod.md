---
{
  "title": "Clash 轮换控制接口密钥后怎样更新面板设置",
  "description": "Clash 轮换控制接口密钥后怎样更新面板设置。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.097422+00:00",
  "lastmod": "2026-10-04T19:25:01.097422+00:00",
  "type": "post"
}
---

轮换 Clash 控制接口密钥，指只修改全局配置里 API 的 `secret`，并让外部用户界面或其它调用方改用新值去访问 `external-controller`。它不自动改写代理端口的 `authentication`，也不能锁住文档标明不验证 secret 的那些入口。面板设置的更新范围应与官方字段一致，避免改错项。

## 适用条件与轮换边界

适用于已经暴露、到期或需要定期更换 API 访问密钥的情况。官方定义 `secret` 为 API 的访问密钥，与 `external-controller` 监听地址（示例 `127.0.0.1:9090`）一起决定 HTTP API 如何被访问。外部界面挂载在 `API 地址/ui`，因此面板侧保存的密钥必须改成新的 `secret`。

下列情况不要指望只轮换 `secret` 就结束：`external-controller-unix`、`external-controller-pipe`、`external-doh-server` 按文档不验证 secret，旧密钥作废后这些入口仍可被访问，需要另行关闭或限制权限。`authentication` 是 http(s) / socks / mixed 的用户验证，与面板密钥不是同一字段。TLS 证书与私钥在 `tls` 段，文档仅说明自 v1.19.18 起本地证书文件可自动重载，没有把证书重载等同于密钥轮换。

## 配置侧如何写下新密钥

在生效配置中把 `secret` 改成新字符串，保留引号规则与原文格式，避免多余空格。不要清空成文档示例里的空字符串，除非明确要变成无密钥 API。保持 `external-controller` 的主机和端口不变，否则面板只改密钥仍会连错端口。若使用 `external-controller-tls`，文档要求使用 TLS 时也必须填写 `external-controller`，轮换密钥时这两处地址都不要漏改或只改一处。

CORS（`external-controller-cors` 的 `allow-origins`、`allow-private-network`）不是密钥，轮换时不必为了「换密」去改来源列表，除非同时在收紧浏览器访问范围。`external-ui`、`external-ui-name`、`external-ui-url` 只决定静态资源目录与下载地址，换密钥不要求改 UI 路径。证书路径若在工作目录外，仍按 `SAFE_PATHS` 规则管理（Windows 分号，其他系统冒号），与 `secret` 分开处理。

改完配置后，以文件中 `secret` 已变为新值、且 unix/pipe/DOH 是否仍开启已被明确记录，作为配置侧完成的判断依据。旧密钥不应留在同一份将要分发的配置里。

## 面板侧如何与新密钥对齐

调用方需要继续指向同一 API 地址和端口，仅将访问密钥替换为新的 `secret`。判断更新成功的依据是：对 `external-controller`（或对应 TLS 端口）的 API 请求使用新密钥被接受，使用旧密钥被拒绝。若面板仍填 `authentication` 里的用户名密码，属于改错凭据类型，应改回 `secret`。

本机回环与 `0.0.0.0` 全接口监听的区别不变：从其它设备更新面板时，先确认内核确实在该设备可达的地址上监听，再测新密钥。不要把「界面静态文件仍能打开」当成密钥已更新；`external-ui` 只提供网页资源，写操作是否通过仍取决于 API 的 `secret`。

## 更新后仍异常时的检查顺序

先核对面板保存的密钥与配置 `secret` 是否逐字相同，再核对端口是否仍为 `external-controller` 所写。旧密钥仍可用，说明新配置未进入正在运行的内核，应回到配置文件确认保存的是新值，而不是只改了面板本地缓存。新密钥无效但 unix 或 namedpipe 可通，符合「这些入口不验证 secret」，应关闭或限制它们，而不是继续轮换字符串。浏览器仅跨域失败时检查 CORS，不要再改 `secret`。证书错误只处理 `certificate`、`private-key` 与 `SAFE_PATHS`。代理端口认证失败则查 `authentication` 与 `skip-auth-prefixes`，与本次密钥轮换无关。字段仍对不上时，以官方「外部控制 (API)」对 `secret` 及各监听项的说明为准。

https://wiki.metacubex.one/config/general/
