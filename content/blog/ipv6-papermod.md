---
{
  "title": "Clash 关闭 IPv6 的临时测试怎样恢复",
  "description": "Clash 关闭 IPv6 的临时测试怎样恢复。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.495405+00:00",
  "lastmod": "2026-10-04T20:33:43.495405+00:00",
  "type": "post"
}
---

临时关闭 Clash 内置 DNS 的 IPv6，通常是为了观察双栈下 AAAA 记录是否干扰连接。手册对应 MetaCubeX 的 DNS 配置页。恢复时必须回到当初改过的字段，而不是只重启内核。下列说明只覆盖配置文件中的 dns 段，不涉及系统网卡开关，也不把一次加载成功写成效果保证。

## 适用条件与官方含义

本恢复步骤适用于进程正在使用内置 DNS，并且你改过 ipv6、服务器附加参数或 fake-ip 的 IPv6 段。手册写明 enable 为 false 则使用系统 DNS，此时改 ipv6 不会作用在系统解析器上。ipv6 表示是否解析 IPv6，为 false 时对 AAAA 回应空解析。测试若把该项设为 false，恢复对应改为 true。

另一处是附加参数。手册允许在发向公网的 DNS 条目后用井号附加、用与号连接参数，其中 disable-ipv6 会丢弃 AAAA 回应。它和顶层 ipv6 不是同一开关。只恢复顶层而服务器仍丢弃 AAAA，观测上仍会像未恢复。enhanced-mode 为 fake-ip 时还有 fake-ip-range6，用于 fakeip 的 IPv6 段。fake-ip-range 只是 IPv4 段，不能替代。系统关闭 IPv6，或查询根本不经过 Clash 监听，不属于本页恢复范围。

判断依据是配置里是否仍存在 ipv6 为 false、条目仍带 disable-ipv6、或 fake-ip 模式缺少 fake-ip-range6。任一成立，都说明 IPv6 解析或映射仍被限制。适用条件不满足时，应先让查询进入内置 DNS，再谈恢复。

## 恢复操作顺序

第一，打开生效配置的 dns 段，确认 enable 为 true。为 false 时先恢复启用，否则后续 IPv6 字段不会接管解析。

第二，把 ipv6 写成 true。手册用「如为 false 则空解析」描述行为，恢复时不要只删行并猜测默认值。

第三，检查 nameserver、fallback、default-nameserver、proxy-server-nameserver、direct-nameserver 以及 nameserver-policy。若条目带附加参数，去掉 disable-ipv6。若使用了 disable-qtype 形式丢弃特定类型回应，确认没有误伤 AAAA。不要改动 ecs、证书校验或代理接口等无关项，以免把一次临时测试扩成整段重写。

第四，若模式为 fake-ip 且需要 IPv6 映射，按手册配置 fake-ip-range6。fake-ip-filter 与 fake-ip-filter-mode 只决定哪些域名不下发 fakeip，不能单独打开 AAAA。filter-mode 为 blacklist、whitelist 或 rule 时，过滤逻辑不同，但都不会代替 ipv6 开关。

第五，保存并重新加载，使 listen 上的 DNS 服务使用新配置。use-hosts 与 use-system-hosts 为真时会回应配置或系统 hosts。hosts 只有 IPv4 时，即使 ipv6 已打开，该域名仍可能没有 AAAA，应先改 hosts。

## 如何判断以及失败时下一步

不要用主观体感当依据。配置加载后，对同一域名查看 AAAA 是否仍为空。若 ipv6 已为 true 且无 disable-ipv6 仍为空，先确认查询是否到达 listen 所指服务；系统解析器未指向该监听时，改 YAML 不会改变结果。再查 nameserver-policy：手册写明它优先于 nameserver 和 fallback，策略目标若仍带 disable-ipv6，AAAA 仍会被丢弃。

然后考虑缓存。cache-algorithm 支持 lru 与 arc，空回应可能被缓存。可等待过期或按客户端既有方式清理 DNS 缓存。fake-ip-ttl 非必要不要修改。respect-rules 为真时 DNS 连接遵守路由规则，并需配置 proxy-server-nameserver，手册强烈不建议与 prefer-h3 一起使用。节点域名解析异常时，应先保证 default-nameserver 为 IP（可为加密 DNS）且节点解析服务器可用。

仍失败则完整对照当前 dns 段与手册字段，排除第二份配置覆盖；确认系统协议栈未关闭 IPv6；fake-ip 场景核对 fake-ip-range6。系统栈问题应转到操作系统网络设置，而不是继续叠加 YAML。

https://wiki.metacubex.one/config/dns/
