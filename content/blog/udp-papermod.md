---
{
  "title": "Clash 更换节点前怎样保留 UDP 问题的复现条件",
  "description": "Clash 更换节点前怎样保留 UDP 问题的复现条件。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:04:06.838606+00:00",
  "lastmod": "2026-10-04T21:04:06.838606+00:00",
  "type": "post"
}
---

更换节点会改写出站路径。若此时同时改动运行模式、日志级别、IPv6、进程匹配或入站范围，所谓 UDP 问题就不再具备同一组复现条件。官方全局配置并未提供名为 UDP 复现开关的字段，因此换节点前应把会改变流量入口、匹配面和观测口径的项全部固定，只允许策略组里的节点选择变化。

## 适用条件

做法适用于已使用 mihomo 内核、故障绑定在某一策略组当前选择上、需要换节点做对比的场景。运行模式可选 `rule`、`global`、`direct`，默认是规则模式：`rule` 按规则匹配，`global` 需在 GLOBAL 策略组里选择代理或策略，`direct` 为全局直连。换节点前若把 `mode` 一并改掉，规则是否生效已变，复现条件即告失效。

若现象来自其他设备经过代理端口上网，还必须保持 `allow-lan`、`bind-address`、`lan-allowed-ips` 与 `lan-disallowed-ips` 不变。资料说明 `allow-lan` 为 true 时允许其他设备经 Clash 代理端口访问互联网；`bind-address` 为 `"*"` 表示绑定所有 IP，也可绑定单个 IPv4 或 IPv6。允许网段默认 `0.0.0.0/0` 与 `::/0`，禁止网段为黑名单且优先级高于白名单。这些项在换节点时被改写，等于换成另一套入站条件。

## 换节点前应固定的项与操作顺序

按下面顺序记录当前值并锁定，再在策略组中更换节点：

1. 记录 `mode`，对照全程保持不变。
2. 记录 `log-level`。对照中不要改成 `silent`，否则控制台与控制页面不再输出一般运行内容。若需要更完整记录，应在换节点前就设为 `debug`，并维持到对照结束。`error` 只保留无法使用级别的错误，`warning` 含不影响运行的错误，`info` 含一般运行内容。
3. 记录 `ipv6`。可选 true/false，默认 true，表示内核是否接受 IPv6 流量。双栈环境下该项会改变可接受的流量族，换节点时改它会引入新变量。
4. 记录 `find-process-mode`：`always` 强制匹配所有进程，`strict` 为默认并由内核判断是否开启，`off` 不匹配进程（资料写明路由器上推荐 off）。进程匹配变化会改变规则命中面。
5. 记录 `interface-name` 与 Linux 下的 `routing-mark`，避免换节点同时改出站网卡或标记。
6. 将 `profile.store-selected` 保持为 true，以便 API 对策略组的选择可在下次启动时对照；本次对照不要用 API 改其他组。`store-fake-ip` 用于保存 fakeip 映射，域名再次连接时沿用原映射，换节点时不要开关它。
7. 保持 `unified-delay`、`tcp-concurrent` 以及 `keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive` 不变。它们改变延迟计算、握手与并发，会使「只有节点变了」不成立。

可用如下片段作为记录口径，不要在对照中途增删：

```yaml
mode: rule
log-level: debug
ipv6: true
find-process-mode: strict
profile:
  store-selected: true
  store-fake-ip: true
```

判断依据：仅策略组选中节点变化，且上述字段以及 `authentication`、`skip-auth-prefixes` 均未改，两次结果才可归因于节点。任一项被改，就不能称为同一复现条件。本机跳过验证的示例如 `127.0.0.1/8`、`::1/128`，对照时也不应改这段。

## 失败时下一步

锁定全局项后更换节点，若现象消失或无法再出现：不要继续改 GEO 加载、全局 UA 或出站接口。保持 `log-level: debug`，核对是否仍有 error 或 warning。确认 `external-controller` 监听地址未被改掉，以免看到的是另一套策略选择。局域网复现时，确认客户端仍落在允许网段且不在禁止网段。

日志过少时，只允许把级别从 `info` 调到 `debug`，不要同时改 `mode` 和节点。路由器上进程匹配为 `off` 时，不要为了查看进程临时改成 `always`，那会改变匹配面。仍无法判断时，按官方全局配置逐项核对当前值与记录值是否一致，而不是叠加新实验项。

https://wiki.metacubex.one/config/general/
