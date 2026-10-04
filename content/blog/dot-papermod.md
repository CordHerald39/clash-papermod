---
{
  "title": "Clash 维护 DoT 配置时怎样保留服务来源记录",
  "description": "Clash 维护 DoT 配置时怎样保留服务来源记录。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.490425+00:00",
  "lastmod": "2026-10-04T20:33:43.490425+00:00",
  "type": "post"
}
---

在 mihomo（Clash Meta）的 DNS 配置里，DoT 以 `tls://` 写出。维护这些条目时，保留服务来源记录并不是文档里的单独开关，而是把「哪一类查询、由哪一组加密 DNS 承担」继续写在仍会被读取的分层字段和 `nameserver-policy` 中，避免只改 `nameserver` 或 `fallback` 后无法追溯来源。以下仅依据官方 DNS 说明，给出适用条件、具体写法和失败后的下一步。

## 适用条件与判断依据

同时满足下列条件再按本文维护：`enable` 为 `true`（官方说明为 `false` 则使用系统 DNS）；配置中使用 `tls://` 作为默认、后备、节点或直连解析服务器；后续仍会调整列表或政策。若不启用核心 DNS，YAML 中的来源划分不会进入解析路径，保留记录没有运行时意义。

用官方语义判断当前来源属于哪一层。`nameserver` 是默认的域名解析服务器。配置 `fallback` 后默认启用 `fallback-filter`，`geoip-code` 为 CN：除该国以外的 IP 结果会被视为污染并改用 fallback；`geoip-code` 配置的国家结果会直接采用。`nameserver-policy` 指定域名查询的解析服务器，可使用 geosite，优先于 `nameserver`/`fallback`，键支持域名通配，值支持字符串或数组。`proxy-server-nameserver` 仅用于解析代理节点域名，不填则遵循 nameserver-policy、nameserver 和 fallback。`proxy-server-nameserver-policy` 格式同 nameserver-policy，当且仅当 `proxy-server-nameserver` 不为空时生效。`direct-nameserver` 用于 direct 出口域名解析，不填同样回落；`direct-nameserver-follow-policy` 默认不遵守 nameserver-policy，仅当 `direct-nameserver` 不为空时生效。`default-nameserver` 用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。若 DoT 写成主机名却未提供 IP 形式的默认服务器，属于前置条件不满足。`respect-rules` 表示 dns 连接遵守路由规则，需配置 `proxy-server-nameserver`，强烈不建议和 `prefer-h3` 一起使用。

## 按场景写下 DoT 并留下来源对应

场景一，把原有服务器改为 DoT：协议写成 `tls://`，官方后备示例为 `tls://8.8.4.4` 与 `tls://1.1.1.1`。默认来源放 `nameserver`，境外可信来源放 `fallback`，不要把两份列表合并成一条后失去角色。可在行尾用注释标明该 `tls://` 的用途；官方示例本身使用注释说明字段，但注释不改变字段优先级。

场景二，按域名保留来源：把对应关系写入 `nameserver-policy`。官方示例将 `+.arpa` 指向 `10.0.0.1`。此后修改全局 `nameserver` 时不要删除这些键，否则分源消失。`fallback-filter` 下的 `geosite` 已废弃，请使用 `nameserver-policy`；`domain`、`ipcidr` 仍用于把结果视为污染或让匹配域名只走 fallback，它们改变的是采用哪一层结果，不是第三套服务器表。维护时若目标是「这类域名固定某 DoT」，应写 policy，而不是只堆 `fallback-filter.domain`。

场景三，节点与直连来源分开：节点域名的 DoT 只写在 `proxy-server-nameserver`（及可选的 `proxy-server-nameserver-policy`）。直连出口写在 `direct-nameserver`；若直连也要沿用政策里的来源，将 `direct-nameserver-follow-policy` 设为 true，否则保持默认不遵守并在直连列表单独写 `tls://` 或 `system`。这样以后改 fallback 不会误伤节点解析。

场景四，来源还要带连接方式：对发向公网地址的 DNS 服务器，使用 `#` 附加、`&` 连接不同参数。除了指定代理/接口和 ecs，其余项的值为 bool。`#RULES` 为遵守路由规则进行连接，等同于 `respect-rules`。如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题。优先使用已有代理，如果不存在该名称的代理则指定接口连接。证书只使用 `skip-cert-verify`（跳过 TLS 证书验证）和 `name-cert-verify`（仅修改证书 DNSName 校验目标，不修改 SNI）。`ecs` 与 `ecs-override` 只指定或覆盖查询 subnet，不能代替来源字段。`prefer-h3` 与 `h3` 作用于 DoH 的 HTTP/3，不能用来标记 `tls://` 来源。

```yaml
dns:
  enable: true
  default-nameserver:
    - 223.5.5.5
  nameserver-policy:
    '+.arpa': '10.0.0.1'
  nameserver:
    - tls://1.1.1.1
  fallback:
    - tls://8.8.4.4
    - tls://1.1.1.1
  proxy-server-nameserver:
    - tls://1.1.1.1
  direct-nameserver:
    - system
  fallback-filter:
    geoip: true
    geoip-code: CN
```

## 失败时的核对顺序与下一步

第一步，确认 `enable` 为 true，否则核心改用系统 DNS，所有 `tls://` 来源不参与。第二步，确认 `default-nameserver` 已是 IP；DoT 使用域名时缺此项会在解析服务器主机名阶段失败。第三步，按查询种类核对应使用的列表：节点域名是否误放在 `nameserver`；直连是否未填 `direct-nameserver` 而混用 fallback；`direct-nameserver-follow-policy` 是否与预期相反；节点政策是否在 `proxy-server-nameserver` 仍为空时被写上（此时官方说明该政策不生效）。

第四步，核对路由与附加参数。`respect-rules` 为 true 却未配置 `proxy-server-nameserver`，或与 `prefer-h3` 同时开启，按文档应先拆开。附加参数里的代理名必须是已有代理。第五步，核 `fallback-filter`：`geoip`、`ipcidr`、`domain` 满足条件时将使用 fallback 结果或只使用 fallback 解析，看起来像默认 DoT 被丢弃。`fallback-lazy-query` 默认 false；为 true 会先判断 nameserver 结果是否满足筛选再发起查询，来源时序会变。`ipv6` 为 false 时回应 AAAA 空解析，应与服务器来源错误区分。`cache-algorithm` 只选择 lru 或 arc，不决定来源。非必要情况下请勿修改 `fake-ip-ttl`。

仍不能对应则回到优先级：`nameserver-policy` 先于 `nameserver`/`fallback`；节点与直连各用独立服务器列表；把已废弃的 geosite 筛选迁到 policy。不要把 `disable-ipv4`、`disable-ipv6` 或丢弃特定 qtype 的附加项当成来源开关。依据：https://wiki.metacubex.one/config/dns/
