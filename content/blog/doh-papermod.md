---
{
  "title": "Clash 换 DoH 服务后怎样验证并保留回退项",
  "description": "Clash 换 DoH 服务后怎样验证并保留回退项。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.492417+00:00",
  "lastmod": "2026-10-04T20:33:43.492417+00:00",
  "type": "post"
}
---

## 适用条件

本节只处理一种维护动作：已经决定把 Clash 的默认查询换成 DoH，同时仍要保留回退解析。判断是否属于该场景，依据是配置里存在 `dns` 段，你准备改写 `nameserver`（或与它并列、且优先于它的策略项），并且不打算删掉 `fallback`。手册把 `nameserver` 定义为默认的域名解析服务器，把 `fallback` 定义为后备域名解析服务器；只要写了 `fallback`，就会默认启用 `fallback-filter`，其中 `geoip-code` 默认值为 CN。

还要先看 `enable`。该值为 false 时使用系统 DNS，后面的 DoH 与回退都不会按 `dns` 段工作。若新 DoH 带主机名而不是纯 IP，必须同时检查 `default-nameserver`：它用于解析 DNS 服务器的域名，必须为 IP，也可以是加密 DNS。`nameserver-policy` 优先于 `nameserver`/`fallback`，因此只替换默认列表、未读策略键时，不能认为全部域名都已换到新 DoH。

## 更换后如何验证并保留回退项

按字段核对，不要假设存在未记载的图形按钮。

第一步，保存更换前的 `nameserver`、`fallback`、`nameserver-policy` 原文。第二步，把新的 DoH 写入 `nameserver`。手册示例采用 HTTPS 查询路径，值可以是字符串或数组。第三步，确认 `fallback` 键仍在。文档写明一般情况下使用境外 DNS，以保证结果可信，示例为 `tls://` 地址。保留回退的判断依据是：该数组未被删除或全部注释，且至少还有一条服务器。第四步，核对 `fallback-filter`。`geoip` 为 true 时，除 `geoip-code` 所写国家以外的 IP 结果会被视为污染，从而采用 fallback 结果；`ipcidr` 所列网段同样视为污染；匹配 `domain` 的域名会直接使用 fallback、不再使用 nameserver。`geosite` 已废弃，应改用 `nameserver-policy`。第五步，检查 DoH 传输开关。`prefer-h3` 表示 DoH 优先使用 HTTP/3；向公网 DNS 追加参数时用 `#`，多个参数用 `&` 连接，其中 `h3` 会强制用 HTTP/3 建立 DoH 连接。新服务若不提供 HTTP/3，应去掉强制项。`respect-rules` 让 DNS 连接遵守路由规则，此时必须配置 `proxy-server-nameserver`，且强烈不建议与 `prefer-h3` 一起使用。

## 失败时的下一步

验证通过的依据是：`enable` 为 true；新 DoH 出现在 `nameserver` 或被策略命中的位置；`fallback` 仍在；过滤条件与“何时改用回退结果”的预期一致；`default-nameserver` 为 IP。

若更换后无法解析 DoH 主机，下一步是补全或修正 `default-nameserver`，并确认它仍是 IP。若查询必须经过代理，应配置 `proxy-server-nameserver`，防止文档所称的鸡蛋问题；该项为空时会退回遵循 nameserver-policy、nameserver 和 fallback。直连出口若不能走新 DoH，应单独填写 `direct-nameserver`；`direct-nameserver-follow-policy` 默认不遵守 policy，且仅当 `direct-nameserver` 非空时生效。`fallback-lazy-query` 默认为 false，为 true 时会先判断 nameserver 结果是否满足 fallback-filter 再发起查询，回退时序异常时应对照该默认值。附加参数里的 `skip-cert-verify`、`ecs`、`disable-ipv4`、`disable-ipv6` 会改变证书校验或记录类型，须与新 DoH 一并记录，而不能当作“可以删掉 fallback”的理由。

参考资料：https://wiki.metacubex.one/config/dns/
