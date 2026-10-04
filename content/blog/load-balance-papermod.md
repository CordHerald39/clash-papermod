---
{
  "title": "Clash 需要固定会话出口时怎样重新选择策略",
  "description": "Clash 需要固定会话出口时怎样重新选择策略。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:04:06.834654+00:00",
  "lastmod": "2026-10-04T21:04:06.834654+00:00",
  "type": "post"
}
---

## 适用条件

当某条流量需要在同一会话里始终走同一个出口，而不是把出口交给未在文档中写明的自动打散逻辑时，应把该出口落到一个可被明确指定成员的策略组上，再用配置改选成员。官方说明里，策略组必须具备 `name` 与 `type`；`proxies` 用于引入出站代理或其他策略组，`use` 用于引入代理集合。示例配置中 `type` 为 `select`。真正决定“现在默认是谁”的是 `default-selected`：该项为空，或填写的节点名在组里不存在时，会默认选择组中第一个节点。组被筛空时不会从其它策略组自动顶上，而是走 `empty-fallback`，默认值为 `COMPATIBLE`，且这里只允许填写 proxy 名称，不支持填写代理组。

## 重新选择出口的操作顺序

先确认规则实际引用的策略组 `name`。名称含特殊符号时应当使用引号包裹，否则后续引用会对不上，改选也会落空。接着核对该组的成员从哪里来：手写的 `proxies`、`use` 引入的集合，以及 `include-all`、`include-all-proxies`、`include-all-providers`。后三项会按名称排序；`include-all` 与 `include-all-proxies` 都不包含策略组，若还要把另一个策略组当作可选出口，只能写进 `proxies`。`include-all-providers` 会使“引入代理集合”失效，成员名单可能整表变化，固定出口前必须先看清当前集合。

然后处理筛选。`filter` 与 `exclude-filter` 按关键词或正则保留或排除节点，多个正则可用反引号区分，且仅作用于引入代理集合以及“引入所有出站代理”。`exclude-type` 不支持正则，用 `|` 分割，按节点类型排除，并且只排除引入的出站代理。目标节点一旦被滤掉，`default-selected` 会变成“名字不存在”，从而退回组内第一个节点，表现为出口被悄悄换掉。把 `default-selected` 改成筛选后仍存在的准确节点名，才是重新指定固定出口的正途。不要把另一个策略组名写进 `empty-fallback`。`disable-udp` 只关闭该组 UDP，并不承担换节点的职责。

健康检查字段要分开看。`url`、`interval`、`timeout`、`max-failed-times`、`expected-status` 只作用于 `proxies` 字段里的代理，不会检查通过 `use` 引入的集合成员。`interval` 不为 0 才启用定时测试；`lazy` 默认为 true，未选择到当前策略组时不进行测试。这些字段影响成员是否被判定可用，不能代替改写 `default-selected`。`expected-status` 可用 `/` 组合多个状态码、用 `-` 表示范围，只有响应符合期望才视为可用。

## 判断依据与失败后的下一步

判断改选是否生效，只看三件事：`default-selected` 是否仍能在引入并筛选后的成员里精确命中；若不能命中，组内第一个节点是谁；若整组为空，`empty-fallback` 指向的是哪一个 proxy。若结果仍不是预期出口，下一步应核对名称引号、筛选是否把目标节点排除、`include-all-providers` 是否打乱了集合，以及是否误把策略组填进了 `empty-fallback`。代理组上的 `interface-name` 与 `routing-mark` 已弃用，出站接口和路由标记应写在代理节点上，优先级为代理节点大于代理策略大于全局；不要用这两个组字段去“换出口网卡”。`hidden` 与 `icon` 只影响 API 展示，不改变选中的代理。

资料：https://wiki.metacubex.one/config/proxy-groups/
