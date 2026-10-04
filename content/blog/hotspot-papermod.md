---
{
  "title": "Clash 切回 Wi-Fi 后怎样清理临时代理设置",
  "description": "Clash 切回 Wi-Fi 后怎样清理临时代理设置。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.867288+00:00",
  "lastmod": "2026-10-04T21:38:12.867288+00:00",
  "type": "post"
}
---

切回 Wi-Fi 后若代理行为仍停留在上一张网卡或上一次排查状态，应把问题理解成全局配置里若干字段尚未收回，而不是去寻找手册未记载的清理入口。适用条件是：当前已使用 Wi-Fi，但出站网卡、运行模式、局域网入站或 Keep Alive 仍按切换前的临时值工作。下列步骤只处理这些字段，并给出判断依据与失败后的下一步。

## 运行模式与出站接口

先读 `mode`。可选值为 `rule`（规则匹配）、`global`（全局代理，需要在 GLOBAL 策略组选择代理或策略）、`direct`（全局直连）；默认是规则模式。切网前若把模式改成全局代理或全局直连，切回 Wi-Fi 后应改回日常使用的值。判断依据：现象是所有域名都走代理或所有连接都直连，且配置里的 `mode` 不是 `rule`。

再读 `interface-name`。该字段指定 mihomo 的流量出站接口。若仍填写旧接口名，流量可能从错误网卡离开。判断依据：配置中存在接口名，且该接口已不是当前 Wi-Fi。处理是改为当前 Wi-Fi 对应接口，或删除该字段以免继续绑定。手册未把此项定义为系统代理开关，因此不能把删除出站接口等同于收回操作系统代理。

## 局域网入站、绑定与验证

`allow-lan` 为 true 时，其他设备可经过 Clash 的代理端口访问互联网。切回 Wi-Fi 后若不再需要共享，应改为 false。`bind-address` 在允许局域网时生效：星号表示绑定所有 IP，也可绑定单个 IPv4 或单个 IPv6。Wi-Fi 地址变化后，旧绑定会导致入站听在错误地址。判断依据：绑定既不是全部地址，也不是当前 Wi-Fi 地址。

`lan-allowed-ips` 默认包含 `0.0.0.0/0` 与 `::/0`；`lan-disallowed-ips` 黑名单优先于白名单，默认空。临时写入的网段应删除。`authentication` 用于 http(s)/socks/mixed 的用户验证；`skip-auth-prefixes` 用于跳过验证的 IP 段，文档示例包括 `127.0.0.1/8` 与 `::1/128`。若曾关闭验证或放宽跳过网段，切回后应收回，避免局域网设备仍能无验证使用端口。

与移动网络相关的还有 TCP Keep Alive：`keep-alive-interval`、`keep-alive-idle` 单位为秒，修改目的是减少移动设备耗电；`disable-keep-alive` 在 Android 上强制为 true。只有这些值是为蜂窝场景改过时，才需要按当前是否仍要省电来决定是否改回。

## 失败时的日志与回退顺序

将 `log-level` 设为 `info` 或 `debug`，在控制台或控制页面查看输出。`silent` 不输出；`error` 仅输出无法使用级别；`warning` 还包含不影响运行的错误。若日志仍显示走旧接口或入站来自非预期地址，回到 `interface-name` 与 `allow-lan`。`ipv6` 默认为 true，只控制是否接受 IPv6 流量，不能当作清理开关。

`find-process-mode` 默认 `strict`，`always` 强制匹配所有进程，`off` 不匹配，手册建议在路由器上使用 `off`。切网时若临时改过，应改回 `strict`。`external-controller` 默认 `127.0.0.1:9090`，改为监听所有 IP 会扩大 API 面；从 Unix socket 或 Windows namedpipe 访问 API 不会验证 secret。临时排查若改过监听，应改回本机，并确认 `secret` 是否仍符合你的安全预期。

若仍无法对应到当前 Wi-Fi：先把 `mode` 设为 `direct` 观察直连是否恢复，再改回 `rule`；同时将 `allow-lan` 设为 false，并去掉错误的 `interface-name`。每次只改一类字段，用同一日志级别对照。字段含义以全局配置文档为准。

资料来源：https://wiki.metacubex.one/config/general/
