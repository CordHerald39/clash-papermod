---
{
  "title": "Clash 怎样记录同一操作前后的流量变化",
  "description": "Clash 怎样记录同一操作前后的流量变化。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.100434+00:00",
  "lastmod": "2026-10-04T19:25:01.100434+00:00",
  "type": "post"
}
---

官方全局配置没有提供“操作前截一笔流量、操作后自动出差分”的台账字段。要记录同一操作前后的流量变化，只能先冻结会改变口径的选项，再用日志和控制面在同一条件下观察，而不是混用不同模式、不同入站范围的两次读数。下面步骤适用于能够编辑配置、查看控制台或控制页面日志的环境。

## 操作前冻结口径并写下当时条件

在做目标操作之前，明确并记录：`mode` 是 `rule`、`global` 还是 `direct`（`global` 还须记下 GLOBAL 策略组所选代理或策略）；`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips` 是否允许其他设备；`ipv6` 是否接受 IPv6；`find-process-mode` 是 `always`、`strict` 还是 `off`；`tcp-concurrent` 是否并发所有解析地址；`interface-name` 与 `routing-mark` 指向哪条出站路径。同时关闭会在后台改数字的项：将 `geo-auto-update` 设为 `false`，避免间隔小时到达后下载 `geox-url` 资源。Keep Alive 相关值也要保持不变，否则空闲探测会污染“操作导致的增量”。判断依据：两次读数只有在上述字段一致时才具有可比性。

## 用日志级别框出操作的时间窗口

把 `log-level` 从 `silent` 调到 `info` 或 `debug`。文档说明日志仅在控制台和控制页面输出：`error` 只保留无法使用级别，`warning` 含不影响运行的错误，`info` 含一般运行内容，`debug` 尽可能输出运行中所有信息。操作步骤：先标记当前日志位置，记录此刻你看到的流量数字（数字来源以实际客户端展示为准，本页不定义面板字段名），执行同一次操作，再记录结束数字与对应日志片段。判断依据：日志中应能对应到这次操作的连接尝试；若只有 GEO 下载、API 访问或 Keep Alive，则差分不能算作该操作的结果。`unified-delay` 计算 RTT，不产生可用的流量流水。`profile.store-selected` 与 `store-fake-ip` 只在下次启动时恢复策略和 Fake-IP 映射，不能当历史流量账本。

## 控制面只能辅助复现，不能替代前后对照

`external-controller` 提供 RESTful API，可用来确认或恢复 `mode` 等运行状态，从而保证“前”和“后”处于同一模式。`external-ui` 是挂在 API `/ui` 上的静态网页资源，打开它本身也会产生流量，对照实验时应避免同时加载这些资源或让其他程序轮询 API。Unix socket 与 Windows named pipe 访问不验证 `secret`，实验期间应防止第三方占用。`authentication` 与 `skip-auth-prefixes` 用于锁住代理端口，减少实验中途混入的连接。ETag 与 `global-ua` 只影响外部资源下载是否复用，与一次业务操作的差分无直接对应关系。

若两次操作的差分不稳定，下一步应检查是否有局域网设备在 `allow-lan` 打开时加入、GEO 是否仍在更新、`tcp-concurrent` 是否造成多次握手，并把日志级别保持在可核对状态后只重复一次操作。本页没有流量时间序列接口说明，因此不要假设内核会自动保存每一次操作的字节差；无法从日志对应到该操作时，应停止用总量做结论，转去规则与 DNS 层查看该连接实际怎么走。

参考资料：https://wiki.metacubex.one/config/general/
