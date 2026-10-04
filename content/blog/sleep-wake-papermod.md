---
{
  "title": "Clash 电脑端：怎样把可复现的唤醒问题整理为报告",
  "description": "Clash 电脑端：怎样把可复现的唤醒问题整理为报告。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.862819+00:00",
  "lastmod": "2026-10-04T21:38:12.862819+00:00",
  "type": "post"
}
---

电脑端若能按同一操作反复出现唤醒，整理报告时应围绕内核全局配置，而不是先罗列节点名称。官方全局配置中的运行模式、日志级别、IPv6、TCP Keep Alive、进程匹配、出站接口和外部控制，决定内核如何保活、如何写日志、以及流量从哪块网卡离开。把字段取值和一次只改一项的步骤写清，接收方才能判断问题是否与保活或接口有关。

## 适用条件与报告必须包含的环境

本方法适用于可编辑 YAML 全局配置的 Clash/mihomo 电脑端，且唤醒能按同一操作再次出现。报告开头应固定下列环境，缺一则无法对照。

运行模式 mode：rule 为规则匹配，global 为全局代理（需要在 GLOBAL 策略组选择代理或策略），direct 为全局直连，默认规则模式。ipv6 可选 true 或 false，默认为 true，决定内核是否接受 IPv6 流量。find-process-mode：always 强制匹配所有进程，strict 由内核判断是否开启（默认），off 不匹配进程，文档推荐在路由器上使用 off。interface-name 指定流量出站网卡。

若 allow-lan 为 true，其他设备可经过代理端口访问互联网，必须同时记录 bind-address：星号表示绑定所有 IP，也可以绑定单个 IPv4 或单个 IPv6。lan-allowed-ips 默认包含 0.0.0.0/0 与 ::/0；lan-disallowed-ips 为禁止段，且黑名单优先级高于白名单。局域网访问会增加本机连接，漏记时容易把外来访问当成电脑自行唤醒。

## 把保活、日志与复现步骤写成对照表

官方说明可通过修改 TCP Keep Alive 减少移动设备耗电。电脑端整理唤醒报告时，应把保活三项当作可切换变量，不要一次改完。

第一步，抄录 keep-alive-interval（Keep Alive 包间隔，单位秒）和 keep-alive-idle（最大空闲时间）。第二步，抄录 disable-keep-alive。文档写明在 Android 上禁用项会被强制为 true，报告必须写明这是电脑端，不能用移动端强制行为解释桌面现象。第三步，选择 log-level：silent 不输出，不能取证；error 仅输出发生错误至无法使用的日志；warning 还包含不影响运行的错误；info 再包含一般运行内容；debug 尽可能输出运行中所有信息。日志仅在控制台和控制页面输出，应保存原文。

第四步，在 mode 与 interface-name 不变的前提下，每次只改保活三项之一，按固定空闲时间观察是否仍被唤醒。第五步，把 unified-delay 与 tcp-concurrent 写入附录。前者开启时会计算 RTT，以消除连接握手等带来的不同类型节点的延迟差异；后者会使用 DNS 解析出的所有 IP 进行连接，并使用第一个成功的连接。二者会改变空闲连接形态，必须写明当时取值。

判断依据：仅调整保活后，唤醒随连接空闲消失，结论应落在 Keep Alive 字段而非代理组；log-level 已是 debug 仍无出站或接口错误、但唤醒仍可复现，应写明日志无对应错误，不要改写成节点不可用。

## 仍无法定位时的下一步

核对 external-controller 监听地址。文档示例为 127.0.0.1:9090，若改为监听所有 IP，其他程序也可能访问 API。Unix socket 与 Windows namedpipe 访问 API 不会验证 secret，若开启需自行保证安全。外部程序轮询 API 会产生流量，报告应写监听范围和是否设置 secret。profile 中 store-selected 会储存策略组选择供下次启动使用，store-fake-ip 会储存 fakeip 映射，域名再次连接时使用原映射。Linux 若配置 routing-mark，为出站连接提供默认流量标记，需原样抄录。报告只附字段原文、日志级别与时间线。

参考资料：https://wiki.metacubex.one/config/general/
