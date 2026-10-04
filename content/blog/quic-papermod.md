---
{
  "title": "Clash 临时协议测试完成后怎样恢复浏览器选项",
  "description": "Clash 临时协议测试完成后怎样恢复浏览器选项。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:04:06.840634+00:00",
  "lastmod": "2026-10-04T21:04:06.840634+00:00",
  "type": "post"
}
---

临时协议测试常会改动内核运行模式、认证或监听范围。浏览器里的协议或代理选项并未写在全局配置手册中，因此本题的“恢复浏览器选项”是指：把会影响浏览器连接 http(s)/socks/mixed 端口的字段改回测试前的可预期状态，再根据请求能否完成来判断。以下只使用手册中的字段与默认值，不补充未记载的系统路径或菜单名称。

## 适用条件与不要扩大的范围

适用于测试期间改过 `mode`、`authentication`、`skip-auth-prefixes`、`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`，或改过 `external-controller` 与 `secret`。手册写明 `mode` 可选 `rule`、`global`、`direct`，且有默认值，默认为规则模式。`global` 需要在 GLOBAL 策略组选择代理或策略，`direct` 为全局直连，二者都容易被误认为浏览器协议损坏。`allow-lan` 可选 `true`/`false`，用于允许其他设备经过代理端口访问互联网。`bind-address` 为 `"*"` 表示绑定所有 IP，也可绑定单个 IPv4 或 IPv6。`lan-allowed-ips` 仅在 `allow-lan` 为 `true` 时生效。`lan-disallowed-ips` 黑名单优先级高于白名单。`authentication` 用于代理用户验证，`skip-auth-prefixes` 设置可跳过验证的 IP 段。

手册 TLS 段写明目前仅用于 API 的 https，使用 TLS 时必须填写 `external-controller`，与浏览器访问网站无关。全局客户端指纹已弃用。`external-ui` 只把静态网页放在 API 的 `/ui`，不是浏览器协议列表。`profile.store-selected` 为 `true` 时会储存策略组选择供下次启动使用，只改变实际出口，不恢复浏览器选项。

## 按字段恢复的操作顺序

把 `mode` 改回测试前的值；无记录则按默认使用 `rule`。删除测试用认证或恢复原列表，并检查本机是否仍应位于 `skip-auth-prefixes`。按测试前需求恢复 `allow-lan` 与 `bind-address`，并从黑名单去掉被误伤的本机或浏览器网段。若测试改过 API 监听，恢复原地址与 `secret`。Unix socket 与 Windows namedpipe 访问 API 不会验证 secret，手册要求自行保证安全，它们不是浏览器恢复路径。将 `log-level` 从 `silent` 改为 `warning` 或 `info`，以便看到不影响运行的错误以及无法使用的错误；`debug` 只适合短时间对照。

## 判断依据与失败时下一步

模式已是 `rule` 时，不应再表现为全局直连或全局强制代理。去掉临时认证后若本机仍被要求验证，说明认证仍生效且未跳过本机。`allow-lan` 为 `false` 时，其他设备上的浏览器失败符合手册，应改回本机验证。`error` 级别只输出无法使用的日志，看不到记录时不能判断恢复结果。

若字段已还原仍不能浏览：检查 `find-process-mode` 是否为 `off`（手册推荐路由器使用；默认 `strict` 由内核判断是否开启）。再核 `interface-name` 与 Linux 的 `routing-mark` 是否指向错误出口。GEO、`global-ua`、`tcp-concurrent` 与浏览器协议项无关。手册没有一键恢复浏览器选项的步骤；内核侧模式、认证、绑定均已一致后，应停止继续堆配置，把剩余差异视为手册未覆盖的浏览器或系统代理设置，并留下测试前的 `mode`、认证与 `allow-lan` 记录。

资料：https://wiki.metacubex.one/config/general/
