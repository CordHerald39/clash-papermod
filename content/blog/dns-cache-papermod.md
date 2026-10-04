---
{
  "title": "Clash 更新域名配置后怎样等待并复核结果",
  "description": "Clash 更新域名配置后怎样等待并复核结果。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.496322+00:00",
  "lastmod": "2026-10-04T20:33:43.496322+00:00",
  "type": "post"
}
---

更新域名相关 DNS 配置之后，手册并没有把“新规则立刻覆盖全部应答”写成确定行为。DNS 段同时包含缓存算法、hosts 开关、`nameserver-policy` 的优先顺序，以及 `nameserver` 与 `fallback` 的分工。等待并复核，是对照这些字段判断旧应答是否仍可能出现，以及新域名规则是否处于应当命中的位置。不能把等待写成固定秒数，也不能把未在手册出现的操作或效果保证写进步骤。

## 适用条件

只适用于已将 `enable` 设为 true 的配置。该值为 false 时使用系统 DNS，域名策略、过滤名单和加密上游都不是复核对象。更新范围通常包括：`nameserver-policy` 的键（支持域名通配，值支持字符串或数组，可使用 geosite，且优先于 nameserver/fallback）；`fake-ip-filter` 及其 `fake-ip-filter-mode`（blacklist、whitelist 或 rule）；`fallback-filter` 的 `domain` 与 `ipcidr`；以及 `nameserver`、`fallback` 中带主机名的服务器。`enhanced-mode` 为 fake-ip 时，过滤名单决定哪些地址不会下发 fakeip 映射。rule 模式下 `fake-ip-filter` 写法与路由规则一致，支持 GEOSITE、RuleSet、DOMAIN 类和 MATCH。`fallback-filter` 内 geosite 字段已废弃，文档要求改用 nameserver-policy；更新后若仍按废弃字段解读结果，复核结论不能成立。

## 等待应对照缓存与 TTL

手册未给出更新后必须暂停的时长。与“是否还要再观察一轮”有关的是缓存和 TTL。`cache-algorithm` 支持 lru（默认）和 arc，说明同一查询可能直接命中缓存。`fake-ip-ttl` 配置 fakeip 查询返回的 TTL，非必要情况下请勿修改。判断依据如下：未改 TTL、也未改缓存算法时，同一域名同一记录类型仍可能返回更新前的结果；`nameserver-policy` 键未命中时，请求仍进入 nameserver 与 fallback，并受 fallback-filter 约束。观察时要固定查询名。`ipv6` 为 false 则回应 AAAA 的空解析，空 AAAA 不能当成策略未生效。`default-nameserver` 用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS；若把仍需解析的域名放进 default，等待无法满足该约束。`prefer-h3` 只影响 DoH 是否优先 HTTP/3，不提供“等待完成”的判据。

## 复核步骤与失败时的下一步

复核按优先级进行。先确认 `use-hosts`（默认 true）是否回应配置中的 hosts，以及 `use-system-hosts`（默认 true）是否查询系统 hosts。再把待复核域名与 nameserver-policy 逐键比对，命中则以该值为解析服务器。未命中则看 nameserver 与 fallback：配置 fallback 后默认启用 fallback-filter，geoip-code 默认为 CN，该国结果直接采用，其他 IP 结果视为污染并采用 fallback；domain 列表内域名直接使用 fallback、不去使用 nameserver；ipcidr 所列网段结果视为污染。fallback-lazy-query 默认 false，为 true 会先判断 nameserver 结果是否满足 filter 后再发起查询。fake-ip-filter-mode 为 whitelist 时只有匹配成功才返回 fake-ip。失败时下一步：确认 enable 为 true；核对通配键与 rule 模式语法；停止用废弃 geosite 过滤字段解释结果；若 DNS 连接遵守路由规则，必须配置 proxy-server-nameserver，以防鸡蛋问题；respect-rules 强烈不建议和 prefer-h3 一起使用。仍不一致则逐项回到字段定义，不添加手册未记载的操作。

资料：https://wiki.metacubex.one/config/dns/
