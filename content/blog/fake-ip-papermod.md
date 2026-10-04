---
{
  "title": "Clash 切换 DNS 模式后怎样记录需要复测的应用",
  "description": "Clash 切换 DNS 模式后怎样记录需要复测的应用。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.494361+00:00",
  "lastmod": "2026-10-04T20:33:43.494361+00:00",
  "type": "post"
}
---

在 Clash 兼容内核的 DNS 配置里，处理模式由 `enhanced-mode` 决定，可选 `fake-ip` 与 `redir-host`，默认是 `redir-host`。把该项在两种模式之间切换，或同时改动假 IP 过滤、IPv6、缓存算法和上游服务器之后，同一应用拿到的解析结果可能从真实地址变成 `fake-ip-range` 里的映射地址（手册示例为 `198.18.0.1/16`），也可能反过来。进程里的解析缓存和已经建立的长连接不会随配置立即作废，因此要在变更前把应当复测的应用记录成清单，并用手册中的字段作为判断依据，而不是假定全部流量会立刻按新模式工作。

## 适用条件

只有 `dns.enable` 为 `true` 时，内核才会接管解析；为 `false` 时使用系统 DNS，与 `enhanced-mode` 无关，不必按模式切换去记应用。出现下列任一变更，就应建立或更新复测清单：把 `enhanced-mode` 在 `fake-ip` 与 `redir-host` 之间切换；修改 `fake-ip-filter`，或把 `fake-ip-filter-mode` 在 `blacklist`、`whitelist`、`rule` 之间更换；修改 `fake-ip-range` 或 `fake-ip-range6`；打开或关闭 `ipv6`，关闭时对 AAAA 回应空解析；修改 `use-hosts` 或 `use-system-hosts`，这两项默认都是 `true`；打开或关闭 `respect-rules`，此时 DNS 连接遵守路由规则，并且需要配置 `proxy-server-nameserver`，手册还写明强烈不建议与 `prefer-h3` 一起使用；调整 `nameserver`、`fallback`、`fallback-filter`、`nameserver-policy`、`direct-nameserver`、`proxy-server-nameserver` 或 `cache-algorithm`（`lru` 为默认，`arc` 可选）。判断依据是：这些字段会改变是否下发 fakeip 映射用于连接、是否丢弃 IPv6、是否改用 fallback 结果、是否回应 hosts。

## 记录复测应用的判断依据

清单建议固定三列：应用用途、关键域名、对应配置项，避免只写含糊名称。具体场景上，从 `fake-ip` 切到 `redir-host` 时，应优先记录此前会拿到映射网段地址的浏览器、即时通讯和长连接类应用，因为它们可能仍访问旧的假地址；从 `redir-host` 切到 `fake-ip` 时，应把 `fake-ip-filter` 内外的域名分开记录——过滤名单内的地址按手册不会下发 fakeip 映射用于连接，名单外的应变为映射地址，对不上就说明过滤条件或模式没有按字段语义生效。

按字段归类时：`blacklist` 下匹配成功则不走 fake-ip，`whitelist` 下只有匹配成功才返回 fake-ip；`rule` 模式的写法和匹配逻辑与路由规则一致，可对规则集、GEOSITE、DOMAIN 等指定 `fake-ip` 或 `real-ip`，最后通常用 `MATCH` 收尾。依赖 hosts 且本次改过两项开关的应用必须列入。需要 AAAA 的双栈应用随 `ipv6` 列入。走直连出口解析的看 `direct-nameserver` 与 `direct-nameserver-follow-policy`。代理节点域名看 `proxy-server-nameserver`，以及仅在该项非空时生效的 `proxy-server-nameserver-policy`。命中 `fallback-filter` 的也要记：`geoip-code` 默认为 CN 时，其他国家的 IP 结果会被视为污染并可能采用 fallback；`ipcidr` 所列网段同样视为污染；`domain` 所列域名会直接使用 fallback，不去使用 `nameserver`。手册指出 `geosite` 字段已废弃，应改用 `nameserver-policy`。查询没有进入 `listen` 所监听服务的内置 DNS 应用，内核模式对其无效，清单里要单独注明，以免把系统解析问题当成模式问题。

## 操作步骤与失败时的下一步

切换前先保存当前 `dns` 段中的 `enhanced-mode`、`fake-ip-range`、`fake-ip-filter`、`fake-ip-filter-mode`、`ipv6`、`nameserver-policy` 和 `fallback-filter`，作为对照。再按上一节写入清单，然后加载新配置。对清单逐条核对应答：当前若是 `fake-ip`，看是否出现 `fake-ip-range` 内的地址；若是 `redir-host`，看是否为真实地址；再对照过滤器，确认该域名是否本来就不该下发 fakeip。`cache-algorithm` 会保留旧结果，应在缓存过期或重启内核之后做第二次核对。如果同时还改了附加参数中的 `disable-ipv4`、`disable-ipv6` 或 `disable-qtype-` 后跟类型号，相关应用也要写入清单。

复测仍与字段语义不符时，一次只回溯一个字段，先不要改路由规则。首先确认 `enable` 为 `true`。其次检查过滤器黑白名单是否用反，`rule` 模式是否缺少最终的 `MATCH`。再次检查 `fallback-filter` 是否把该应用的解析推到 fallback。若 DNS 查询需要经过代理，必须配置 `proxy-server-nameserver`，手册用以避免鸡蛋问题。`default-nameserver` 必须写成 IP，用于解析 DNS 服务器的域名。若仍无法判断，把该应用的域名写进 `nameserver-policy` 单独指定服务器，或在过滤器中明确标注 `real-ip` 或 `fake-ip`，然后只复测这一条，从而把 DNS 模式问题与路由规则问题分开。

https://wiki.metacubex.one/config/dns/
