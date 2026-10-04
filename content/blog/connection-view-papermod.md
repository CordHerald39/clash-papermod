---
{
  "title": "Clash 关闭无关应用后怎样重新采集连接样本",
  "description": "Clash 关闭无关应用后怎样重新采集连接样本。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.098466+00:00",
  "lastmod": "2026-10-04T19:25:01.098466+00:00",
  "type": "post"
}
---

关闭无关应用后重新采集 Clash 连接样本，目的是减少入站噪声，让目标、进程匹配和日志能对上同一次访问。官方全局配置并不描述操作系统如何结束进程，但提供了进程匹配模式、日志级别、Fake-IP 与策略选择是否落盘、保活以及外部控制器等项，用来约束“样本里有什么、从哪观察、会不会混进旧状态”。采集前应先保证观察通道指向同一内核，再限制谁能连入、是否匹配进程。

## 适用条件：样本必须来自可控制的入站窗口

采集前确认 `external-controller` 已监听，控制页面或 API 读的是该进程。地址示例为 `127.0.0.1:9090`；HTTPS 还需 `external-controller-tls` 与 `tls` 证书。`secret`、CORS、`external-ui` 只影响你能不能看见样本，不生成连接。Unix socket 或 named pipe 访问 API 不验证 secret，但不要把其他内核的套接字误当成当前样本源。

关闭无关应用后，本机仍可能有系统服务走代理端口。`allow-lan` 为 true 时，局域网上其他设备也会写入样本；采集单机行为时应保持 false，或用 `bind-address`、`lan-allowed-ips`、`lan-disallowed-ips` 把来源限制到本机。`authentication` 可挡住未授权客户端，避免别人的请求混进同一批连接。需要本机免验证时把回环写入 `skip-auth-prefixes`。

判断依据：观察面连上之后，在未发起目标访问前列表应接近静止。若仍持续出现外来源地址，先收紧局域网与验证，而不是开始保存样本。

## 按进程匹配和模式采集，避免旧映射污染

`find-process-mode` 决定样本里有没有可用的进程维度。`always` 强制匹配所有进程，适合核对“关闭无关应用后是否只剩目标进程”；`strict` 由 Clash 判断是否开启；`off` 不匹配，文档建议路由器使用，此模式下即使关应用，样本也无法用进程名过滤，只能靠目标地址区分。规则若包含进程条件，采集期间不要把该项在 always 与 off 之间来回改，否则前后样本不可比。

`mode` 必须固定。`rule`、`global`、`direct` 会让同一目标进入不同出站，混在一批样本里无法解释。`profile.store-selected` 为 true 时，上次 API 选择的策略组会在启动后恢复，采集前要确认 GLOBAL 或其他组的选择就是本次要测的值。`profile.store-fake-ip` 为 true 会沿用原有 Fake-IP 映射，域名样本可能打到旧地址；若本次要观察真实解析路径，需理解该项会使“关闭应用后的新连接”仍复用映射，而不是自动得到新 IP。

`ipv6` 与 `tcp-concurrent` 影响样本中的目标形态：前者决定是否出现 IPv6 会话，后者可能对同一域名产生多个 IP 的连接尝试并取第一个成功。记录样本时应注明这两项，否则无法判断条数为什么多于一次点击。

## 日志、保活与失败后的下一步

将 `log-level` 调到 `info` 或 `debug`，使之在控制台和控制页面留下与样本同时段的输出；`silent` 无法复核。`keep-alive-interval`、`keep-alive-idle` 以秒计，无关应用关闭后仍可能有保活包；`disable-keep-alive` 在 Android 上强制为 true。解读样本时，把间隔内的短连接与保活区分开。`unified-delay` 只影响延迟计算，不作为采样开关。`interface-name` 与 `routing-mark` 应保持不变，否则出站变化会被误认为应用关闭带来的差异。

失败时下一步：若关应用后样本仍很杂，检查 `allow-lan` 与黑白名单、是否有其他设备走同一端口。若样本没有进程信息，将 `find-process-mode` 从 `off` 改为可匹配的模式后再采一次，并保持 `mode` 不变。若域名目标 IP 与预期不符，核对该项是否启用了 `store-fake-ip`。观察通道空白时先修 `external-controller`、密钥和 TLS，不要保存空列表。同一配置下只复现一次目标访问，用 `debug` 日志对齐该时间窗，得到的才是可对比的连接样本。

资料：https://wiki.metacubex.one/config/general/
