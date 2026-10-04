---
{
  "title": "Clash 怎样保存一次 DNS 修改的原因与回退值",
  "description": "Clash 怎样保存一次 DNS 修改的原因与回退值。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.107526+00:00",
  "lastmod": "2026-10-04T19:25:01.107526+00:00",
  "type": "post"
}
---

## 适用条件：改 DNS 前要留下什么

调整 Clash（mihomo）的 `dns` 段前，应同时保存“为什么改”和“改之前的值”，以便失败时按官方字段语义回退，而不是凭记忆重写整段。适用条件：变更 `enable`、解析模式、服务器列表、策略、filter、fake-ip 过滤、节点/直连专用 DNS、或附加参数。不适用于只改规则、不改 DNS 的操作。官方对多项给出默认或前提：例如 `enhanced-mode` 默认 `redir-host`，配置 `fallback` 后默认启用 `fallback-filter` 且 geoip-code 为 CN，`direct-nameserver-follow-policy` 默认不遵守 policy，`geosite` 在 fallback-filter 中已废弃。

原因应写成与文档一致的动机，例如：nameserver 结果命中 ipcidr 或非 geoip-code 国家从而不可信；某域名需 nameserver-policy 单独指定；节点域名出现鸡蛋问题需 `proxy-server-nameserver`；直连出口需 `direct-nameserver`；`ipv6: false` 导致 AAAA 为空；`respect-rules` 与 `prefer-h3` 不宜同时使用等。不要写未出现在配置说明中的效果保证。

## 建议保存的回退值清单

完整复制当前 `dns` 块作为回退快照，并单独列出将要改动的键的旧值：`enable`；`cache-algorithm`（lru 为文档所述默认算法之一，arc 为另一选项）；`prefer-h3`；`listen`；`ipv6`；`enhanced-mode`；`fake-ip-range` / `fake-ip-range6`；`fake-ip-filter` 与 `fake-ip-filter-mode`（含 rule 模式下各条 fake-ip/real-ip）；`fake-ip-ttl`（文档写非必要勿改）；`use-hosts`、`use-system-hosts`；`respect-rules`；`default-nameserver`（必须为 IP 的那份列表）；`nameserver-policy` 中被改动的键值；`nameserver`；`fallback`；`fallback-filter` 的 geoip、geoip-code、ipcidr、domain（及若仍存在的 geosite）；`fallback-lazy-query`；`proxy-server-nameserver` 与 `proxy-server-nameserver-policy`；`direct-nameserver` 与 `direct-nameserver-follow-policy`；nameserver URL 上 `#` 附加的代理、ecs、skip-cert-verify、disable-ipv4/ipv6、disable-qtype 等。

原因旁注明对应官方约束，便于回退时检查：例如开启 respect-rules 时必须有 proxy-server-nameserver；default-nameserver 不能改成域名；filter 的 domain 会让匹配域名跳过 nameserver；fake-ip-filter-mode 为 whitelist 时只有匹配项才返回 fake-ip。

## 回退步骤与失败时的下一步

回退按键恢复快照中的旧值，不要只关 `enable` 除非当时改的就是它：`enable: false` 会改用系统 DNS，语义与“恢复原 nameserver 列表”不同。先恢复本次改动的最小集合：只动过 policy 就只还原该键；只动过 fallback-filter 就还原 geoip/ipcidr/domain；节点解析问题只还原 proxy-server 两项；直连只还原 direct-nameserver 两项。恢复后按官方优先级验证：policy 是否仍优先、fallback 是否仍按 filter 切换、fake-ip-filter 是否仍排除或放行该域名。

若回退后仍失败，说明原因记录可能不完整：补记该域名是否命中废弃 geosite 写法、hosts 是否抢答、AAAA 是否被置空、附加参数是否丢弃记录类型。下一步将问题域名单独放入 nameserver-policy 做隔离，或对比 `enable: false` 与原列表的差异，再决定新的最小修改。新修改同样先写原因与新的回退值，避免连续改动无法还原。

https://wiki.metacubex.one/config/dns/
