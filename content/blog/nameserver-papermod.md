---
{
  "title": "Clash 怎样维护有来源说明的 DNS 配置",
  "description": "Clash 怎样维护有来源说明的 DNS 配置。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.489283+00:00",
  "lastmod": "2026-10-04T20:33:43.489283+00:00",
  "type": "post"
}
---

维护带有来源说明的 DNS 配置，核心是把每一组地址、每一条过滤条件都对应到官方字段，并在配置里用注释写清这段解决什么问题、在什么条件下才会被使用。适用前提是启用内置 DNS：`dns.enable` 为 true。若为 false，将使用系统 DNS 解析，后续对 `nameserver`、`fallback`、各类 policy 的修改都不会按手册字段生效，来源说明也就失去对照意义。不要把引导地址、节点域名服务器和最终查询服务器写成同一份名单，否则注释无法对应职责。

## 把服务器列表登记到对应职责

官方将解析职责拆开，维护时必须分列记录。`default-nameserver` 用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。`nameserver` 是默认的域名解析服务器。`fallback` 是后备域名解析服务器；配置 fallback 后默认启用 `fallback-filter`，`geoip-code` 默认为 CN。`proxy-server-nameserver` 仅用于解析代理节点的域名，不填则遵循 `nameserver-policy`、`nameserver` 和 `fallback`。`direct-nameserver` 用于 direct 出口域名解析，不填时同样回退到上述三类。

针对「给现有配置补来源说明」的场景，按下列步骤处理。第一，确认 `enable` 为 true。第二，将引导用地址写成 IP，例如 `223.5.5.5`。第三，为最终查询、节点域名、直连出口分列服务器。第四，在每列旁注释字段名与职责。判断依据是：需要先解开上游主机名的地址只能进入 `default-nameserver`；面向访问目标的查询才进入 `nameserver` 或 `nameserver-policy`。`nameserver-policy` 指定域名所用服务器，键支持域名通配，值支持字符串或数组，且优先于 `nameserver` 与 `fallback`。

## 把策略约束和废弃项写进来源说明

`proxy-server-nameserver-policy` 格式同 `nameserver-policy`，仅用于节点域名解析，当且仅当 `proxy-server-nameserver` 不为空时生效。`direct-nameserver-follow-policy` 默认不遵守 `nameserver-policy`，仅当 `direct-nameserver` 不为空时生效。`fallback-filter` 里，`geoip` 控制是否用国家判断；除指定国家外的 IP 结果视为污染并改用 fallback。`ipcidr` 网段结果视为污染；`domain` 匹配的域名直接使用 fallback，不再使用 nameserver。`geosite` 字段已废弃，应改用 `nameserver-policy`，来源说明里要写明迁移原因，避免继续按已废弃字段维护。

若 DNS 连接须遵守路由规则，设置 `respect-rules`，并配置 `proxy-server-nameserver`。手册强烈不建议与 `prefer-h3` 同时使用。附加参数用 `#` 追加、`&` 连接；可指定已有代理，不存在则指定接口；`#RULES` 等同遵守路由规则。如需经代理查询，同样配置 `proxy-server-nameserver`，防止鸡蛋问题。这些约束必须留在来源说明中，避免只复制地址而丢掉生效条件。

## 失败时按来源收缩检查范围

查询分层不符合预期时，先核对 `enable`。上游主机名无法解开时，检查 `default-nameserver` 是否仍是 IP。节点域名异常时，确认 `proxy-server-nameserver` 已填写，再看 policy 是否因列表为空而未生效。直连策略未跟随 policy 时，核对该跟随开关的默认行为与 `direct-nameserver` 是否为空。`enhanced-mode` 与 `fake-ip-filter` 属于如何向连接返回结果，与服务器来源不是同一层，来源说明应分开记录。下一步只改正职责不匹配的字段，保留其余已标注条目，便于对照手册复查。

https://wiki.metacubex.one/config/dns/
