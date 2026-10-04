---
{
  "title": "Clash 临时 hosts 排查结束后怎样移除修改",
  "description": "Clash 临时 hosts 排查结束后怎样移除修改。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.498395+00:00",
  "lastmod": "2026-10-04T20:33:43.498395+00:00",
  "type": "post"
}
---

临时 hosts 只应留在定位解析问题的时间窗内。排查结束后，要把配置中的 hosts、系统 hosts 的引用，以及为了让映射生效而改过的 DNS 开关恢复到常态。官方相关控制是：`enable` 决定是否启用 Clash DNS，为 false 则使用系统 DNS 解析；`use-hosts` 决定是否回应配置中的 hosts；`use-system-hosts` 决定是否查询系统 hosts。移除时应对这些字段逐项还原，避免只删一行地址却留下被改过的全局行为。

## 哪些改动算临时修改

适用于曾经为排查旧地址、污染或连通性而加入静态映射，现在原因已定位或试验已结束的场景。判断依据：能指出哪些主机名是临时加入的；能指出改动过哪些 DNS 字段；业务不再依赖那条固定 IP。

若临时映射已经变成长期需求，则不属于排查结束移除，应按正式配置另行管理，不在本次还原范围内。为排查顺带改过的 `enhanced-mode`、`fake-ip-filter`、`nameserver-policy`、`fallback` 相关条目，只要不是正式策略，同样算临时修改，不能只处理 hosts 行。

## 按来源撤销映射

先列出变更清单：配置中的 hosts 新增或改写的主机名；操作系统 hosts 里的临时行；`use-hosts`、`use-system-hosts`、`enable`、`listen`、`ipv6`、`enhanced-mode`、`fake-ip-filter` 是否被一并改过。这些字段职责不同，漏掉开关会出现「映射删了行为仍不对」或「开关被关导致其他域名解析方式改变」。

删除配置中的临时 hosts 条目后，该主机名不再由「配置中的 hosts」提供静态回应。若希望 DNS 模块彻底忽略配置中的 hosts，可以把 `use-hosts` 设为 false；仅当确认没有任何正式 hosts 依赖时才关闭。默认值为 true，恢复常态通常是删条目并保持默认，而不是一律改 false。

若排查时改过操作系统 hosts，且 `use-system-hosts` 为 true，模块仍会查询系统 hosts。只删配置中的条目不足以消除这些记录，需要还原系统文件中的临时行。系统 hosts 还要留给其他程序、但 Clash 不应读取时，可将 `use-system-hosts` 设为 false。默认值为 true，是否关闭取决于 Clash 是否还需要系统文件中的其他正式记录。

为排查改过的全局 DNS 行为要一并还原。`nameserver-policy` 优先于 nameserver/fallback；配置 fallback 后默认启用 `fallback-filter`，`geoip-code` 为 cn。把临时 policy 或 domain 污染列表留在配置里，等于排查结束后仍在改写解析路径。

缓存需要单独看待。`cache-algorithm` 支持 lru（默认）与 arc。删除映射后，短期内仍可能返回排查期间的静态 IP。判断依据：配置已无该 hosts，但查询仍是临时地址。下一步是再次查询确认，而不是立刻认定删除失败。

若临时把节点名写进 hosts，移除后节点解析应回到 `proxy-server-nameserver`，或文档所述的 nameserver-policy、nameserver 和 fallback。direct 侧回到 `direct-nameserver`。不要留下只为排查存在的 `proxy-server-nameserver-policy` 条目；该字段当且仅当 proxy-server-nameserver 不为空时生效。

## 撤销后行为异常如何处理

删除后出现解析失败，先判断该名字在正式配置里本应走 `nameserver`、`nameserver-policy` 还是 `fallback`。检查 `default-nameserver` 是否仍为 IP，以便解析 DNS 服务器的域名。

删除后仍解析到临时 IP，先查系统 hosts 与 `use-system-hosts`，再查缓存，再查是否还有 policy 或其他条目指向同一地址。

删除后无关域名行为变化，说明还原时误改了 `enable`、`respect-rules`、`fake-ip-filter` 或 fallback 相关字段。`respect-rules` 需配置 `proxy-server-nameserver`，且强烈不建议和 `prefer-h3` 一起使用。下一步是对照排查前的 DNS 片段做逐字段差异，而不是重新加回临时 hosts。

`ipv6` 若曾为核对 AAAA 而调整，移除阶段一并恢复，以免留下 AAAA 空解析。`listen` 若只为试验查询而扩大监听范围，也应恢复原值，避免把试验用 DNS 服务留在更宽的地址上。

https://wiki.metacubex.one/config/dns/
