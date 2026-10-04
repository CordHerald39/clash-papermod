---
{
  "title": "Clash 域名迁移后怎样维护 DNS 策略匹配项",
  "description": "Clash 域名迁移后怎样维护 DNS 策略匹配项。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.493412+00:00",
  "lastmod": "2026-10-04T20:33:43.493412+00:00",
  "type": "post"
}
---

域名迁移后，原来写在 DNS 策略里的匹配项可能不再命中，查询会落到 `nameserver`、`fallback`，或落到直连、节点专用上游。维护对象是 `nameserver-policy` 的键，以及与之平行的 `proxy-server-nameserver-policy`、`fallback-filter.domain`，而不是路由规则里的域名列表。官方说明 `nameserver-policy` 指定域名查询的解析服务器，可使用 geosite，优先于 `nameserver` 与 `fallback`；键支持域名通配，值支持字符串或数组。`fallback-filter` 的 `geosite` 已废弃，集合类匹配在迁移时应改到 `nameserver-policy`。维护目标是让新域名重新命中原定上游，并清掉不会再出现的旧键。

## 适用条件与要维护的匹配项

适用于主域搬家、新增 CDN 主机名、证书域名更换、代理节点换域名、国内集合 rule-set 或 geosite 内容更新之后，仍希望解析指向原定上游的场景。必须保持 `dns.enable` 为 true，否则系统 DNS 不会读取这些匹配项。需要盘点的键包括：精确域名、通配（文档示例为 `+.arpa`）、geosite、`rule-set:` 引用（文档示例为 `rule-set:cn`）。节点新域名还要维护 `proxy-server-nameserver-policy`，且仅当 `proxy-server-nameserver` 非空时生效。直连相关若使用了 `direct-nameserver`，还要确认 `direct-nameserver-follow-policy` 是否仍应遵循 `nameserver-policy`，该项默认不遵守。`fallback-filter.domain` 中的污染域名名单若仍写旧域，会出现新域不再直接走 `fallback`、或旧域继续被强制走 `fallback` 两种偏差。`default-nameserver` 在上游服务器自身也改用域名时必须仍为 IP，它不承担业务域名匹配。

## 维护步骤

第一步，列出迁移前后的域名形态：apex、www、CDN 子域、以及是否仍能被同一通配覆盖。若旧键是精确匹配，新域不会自动继承，需要新增键或改为仍能覆盖双方的通配。第二步，更新 `nameserver-policy`：键改为新域名、新通配、仍有效的 geosite 或 `rule-set:`；值保持为目标上游的字符串或数组。第三步，检查集合内容是否仍包含新域。依赖 `rule-set:` 或 geosite 的键，其命中取决于集合是否收录该域名；集合未更新时，策略键还在，查询仍会落到 `nameserver`。第四步，删除或改写已经不会再出现的旧键，避免残留键把偶发旧流量指到已下线的内网 DNS。第五步，若迁移的是代理节点域名，先保证 `proxy-server-nameserver` 非空，再改 `proxy-server-nameserver-policy` 中对应键。不填专用节点 DNS 时，节点域名会遵循 `nameserver-policy`、`nameserver` 和 `fallback`，可能把节点解析送到不合适的上游，并诱发鸡蛋问题。第六步，把 `fallback-filter` 中已废弃的 `geosite` 迁到 `nameserver-policy`，并同步增删 `domain` 名单中的新旧域名。第七步，若访问新上游需要遵守路由或经过代理，检查 `respect-rules` 与 `proxy-server-nameserver`；文档强烈不建议将 `respect-rules` 与 `prefer-h3` 一起使用。附加参数只作用于该条 DNS 服务器的连接方式，不能代替把新域名写进策略键。

## 判断依据与失败时下一步

判断依据：新域名能被某一 `nameserver-policy` 键匹配，才会使用该上游；不能匹配则使用 `nameserver`，并可能经 `fallback-filter` 改走 `fallback`。通配是否覆盖子域，以文档支持的域名通配为准，不要假设路由规则里的域名匹配写法可以原样搬进策略键。`direct-nameserver` 非空且 follow-policy 为 false 时，直连出口解析不会跟随刚改好的 `nameserver-policy`。`proxy-server-nameserver-policy` 在缺少 `proxy-server-nameserver` 时不会生效，节点换域后只改 policy 不够。

失败时下一步：为新域增加更精确的策略键；先更新 rule-set 或 geosite 集合再依赖集合键；节点换域时成对修改 `proxy-server-nameserver` 与 policy；直连场景按需打开 follow-policy；清理 `fallback-filter.domain` 中的旧名并停止使用已废弃 geosite 字段；确认 `enable` 仍为 true。不要把路由规则中的域名列表当作 DNS 策略已经同步更新的证据。完成上述维护后，再单独检查 DNS 查询连接能否到达新上游。

资料：https://wiki.metacubex.one/config/dns/
