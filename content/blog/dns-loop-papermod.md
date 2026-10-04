---
{
  "title": "Clash 改 DNS 架构时怎样保留清晰的依赖记录",
  "description": "Clash 改 DNS 架构时怎样保留清晰的依赖记录。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.496322+00:00",
  "lastmod": "2026-10-04T20:33:43.496322+00:00",
  "type": "post"
}
---

调整 Clash（mihomo）DNS 架构时，字段一改，依赖方向就会变。官方把解析拆成引导、策略、默认、后备、节点、直连多层，并且用回落规则把空字段接回去。若不留下依赖记录，事后很难判断是哪一次修改把查询重新接到入口。记录应写“谁解析谁、在什么条件下生效”，而不是只保存一份最终 YAML。

## 适用条件

在变更 `enable`、`listen`、`default-nameserver`、`nameserver`、`fallback`、`nameserver-policy`、`proxy-server-nameserver`、`direct-nameserver`、`respect-rules` 或上游 `#` 附加参数之前，应先记下当前依赖。`enable` 改为 false 后改走系统 DNS，也要记录这一跳，以免下次启用时按旧 nameserver 恢复。`fallback-filter` 的 `geosite` 已废弃，文档要求改用 `nameserver-policy`；迁移时必须记下旧 geosite 集合与新 policy 键的对应关系，否则依赖记录会与现行优先级冲突。

## 按官方职责登记依赖

建议为每个字段建一条记录，至少包含：用途、取值形态（IP 还是 URL）、是否依赖其他字段、空值时回落到哪里。

- `listen`：DNS 入口，示例为 `0.0.0.0:1053`，支持 UDP/TCP。记录地址端口，供对照上游是否回指。
- `default-nameserver`：解析 DNS 服务器域名，必须为 IP，可为加密 DNS。这是引导层，应单独成表，避免和业务 nameserver 混记。
- `nameserver-policy`：指定域名用哪组服务器，优先于 `nameserver` / `fallback`，键支持域名通配。记录键与值的对应，以及是否引用 rule-set。
- `nameserver` / `fallback`：默认与后备。配置 `fallback` 后默认启用 `fallback-filter`（geoip、geoip-code、ipcidr、domain）。记录过滤条件，避免只记服务器列表。
- `proxy-server-nameserver`：仅解析代理节点域名；未填则遵循 policy、nameserver 和 fallback。`proxy-server-nameserver-policy` 格式同 policy，且仅当前者非空生效——记录里要写明这条生效条件。
- `direct-nameserver`：直连出口域名；未填同样回落。`direct-nameserver-follow-policy` 默认不遵守，仅当 direct-nameserver 非空生效。
- `respect-rules`：DNS 连接遵守路由，需配置 `proxy-server-nameserver`；强烈不建议与 `prefer-h3` 一起使用。上游 `#proxy`、接口、`#RULES`（等同遵守路由）以及 `ecs`、`h3` 等附加参数应记在对应 URL 旁。

## 变更时如何保持记录可读

每次只改一层，并在记录中写清“切断了哪条回落、新增了哪条边”。例如把节点解析从隐式回落改为显式 `proxy-server-nameserver`，应写：节点域名不再进入 `nameserver`，引导仍由 `default-nameserver` 的 IP 完成。把 DoH 加上 `#proxy` 时，必须同时登记鸡蛋问题相关依赖：节点域名由哪组服务器解析、该组是否还需要该代理。`use-hosts`、`use-system-hosts` 影响是否先应答 hosts，也应记，以免把“未发出上游查询”误当成架构已隔离。不要把 `fake-ip`、`fake-ip-filter` 写进上游依赖表，它们改变的是给客户端的应答，不改变服务器之间的解析边。

## 记录对不上实际配置时下一步

判断依据：从任意域名出发，按记录的优先级（policy → nameserver/fallback 过滤 → 节点/直连专用字段 → 空值回落）应能走到与当前配置相同的终点。若对不上，先查生效条件是否被忽略（policy 在专用 nameserver 为空时不生效、follow-policy 默认关闭、geosite 过滤已废弃）。下一步是以文档字段为准回写记录，而不是按记忆补一条 nameserver。引导层取值不是 IP、或经代理查询缺少 `proxy-server-nameserver` 时，应先修正配置并更新依赖表，再继续改其余架构，避免在错误回落上叠加新的引用。

https://wiki.metacubex.one/config/dns/
