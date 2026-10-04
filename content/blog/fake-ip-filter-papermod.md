---
{
  "title": "Clash 过滤列表增长后怎样定期清理失效项",
  "description": "Clash 过滤列表增长后怎样定期清理失效项。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.492417+00:00",
  "lastmod": "2026-10-04T20:33:43.492417+00:00",
  "type": "post"
}
---

fake-ip-filter 列表会随使用逐渐变长，其中部分条目可能已不再需要真实 IP 或已被更好的集合替代。定期清理应严格依据官方 DNS 字段的现行行为，而不是主观猜测。本节说明清理的适用条件、核对步骤、判断依据以及清理后仍异常时的处理。

## 清理前必须满足的配置条件
只有 dns.enable 为 true 且 enhanced-mode 为 fake-ip 时列表才有意义。先读取 fake-ip-filter-mode。blacklist 下列表中的项是“不下发 fake-ip”的排除名单，清理某项意味着该域名重新开始使用 fake-ip。whitelist 下列表是“允许 fake-ip”的白名单，清理某项意味着该域名改为真实 IP。rule 模式下每条都带动作，清理时必须连同 fake-ip 或 real-ip 动作一起评估，且最后一条 MATCH 不能删除。适用条件是列表已明显增长、出现重复通配或与 nameserver-policy、fallback-filter 的 domain 高度重叠。

同时确认 use-hosts、use-system-hosts 仍为默认 true，hosts 中已存在的名称可从静态过滤列表中移除。respect-rules 若为 true，须保证 proxy-server-nameserver 有效，否则清理后的解析路径可能循环。

## 逐项对照官方语法与关联列表
操作上把当前 fake-ip-filter 完整列出，与 nameserver-policy 的键、fallback-filter 的 domain、geosite（已废弃但可能残留）、ipcidr 做交叉。若某域名已在 policy 中单独指定服务器，其解析结果类型已固定，过滤项可能冗余。rule 模式下检查 RULE-SET 的 behavior 是否仍为 domain 或 classical，classical 只生效域名类规则，过时集合可整体替换为更精确的单条 DOMAIN。文档示例 '*.lan' 类通配若实际环境已无局域网流量，即可考虑删除。

判断某项失效的依据是：该域名当前无论是否过滤，连接均正常；或该名称已改由 direct-nameserver 解析且 direct-nameserver-follow-policy 行为符合预期。proxy-server-nameserver-policy 只作用于节点域名，普通过滤项与之无关，清理时不必保留。fake-ip-range 与 fake-ip-range6 未变则无需因网段变化而批量删除。

## 清理执行与回退步骤
建议每次只删除或注释最少数量的条目，保存后重新加载核心，观察原问题域名是否重新出现异常。rule 模式删除中间规则后必须保证 MATCH 仍在最后。若清理后立刻出现新的连接失败，立即恢复刚删除的那一条，说明该项仍承担排除 fake-ip 的职责。可将高频变化的域名改为引入域名集合，减少静态列表体积，但集合 behavior 必须符合官方要求。prefer-h3、cache-algorithm、fake-ip-ttl 与列表维护无关，不要一并修改。全部清理判断均来自官方对 filter、mode、policy 及 fallback-filter 字段的现行说明。

https://wiki.metacubex.one/config/dns/
