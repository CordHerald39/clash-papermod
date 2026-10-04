---
{
  "title": "Clash 怎样记录不同系统上可用的 TUN 组合",
  "description": "Clash 怎样记录不同系统上可用的 TUN 组合。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.100434+00:00",
  "lastmod": "2026-10-04T19:25:01.100434+00:00",
  "type": "post"
}
---

记录不同系统上可用的 Clash（mihomo）TUN 组合，应依据官方入站说明，按「系统 × 协议栈 × 依赖项是否满足」建表，而不是只保存一份通用 YAML。`stack` 可用值为 `system`、`gvisor`、`mixed`、`mips`；默认 `mips`，并写明如无使用问题建议使用 mips 栈。组合是否可用，还取决于防火墙、网卡名、以及大量仅 Linux 或仅 Android 生效的字段。

## 按系统拆开协议栈与防火墙条件

每一行至少包含：操作系统、`stack` 取值、防火墙是否开启、是否已按文档放行。资料写明打开防火墙则无法使用 `system` 和 `mixed`。Windows 记录是否已在设置 → Windows 安全中心 → 允许应用通过防火墙中选中内核。MacOS 记录防火墙是否开启、是否按系统设置 → 网络 → 防火墙 → 选项添加了 mihomo app（一般无需配置，默认放行签名软件）。Linux 记录是否对 TUN 网卡出站做了放行，文档示例为 `sudo iptables -A OUTPUT -o Mihomo -j ACCEPT`。

判断依据：同一 `stack` 在「防火墙开/关」下应分成两行。`gvisor` 与 `mips` 不受上述「无法使用 system 和 mixed」那条直接约束，但仍应记下防火墙状态，避免以后把环境差异抄错。协议栈网络回环测试仅供参考，且 linux 与 Windows、MacOS 可能有差异，回环结果必须标注平台，不能合并成一条「通用可用」。

## 把仅某系统支持的字段写成组合的一部分

`device` 在 MacOS 只能使用 utun 开头的网卡名，该系统上的组合必须带上网卡名前缀约束。`auto-redirect` 仅支持 Linux，且需要 `auto-route` 已启用；Android 上仅转发本地 IPv4 连接。`gso` 仅支持 Linux。UID、MAC、接口包含/排除仅在 Linux 且常需 `auto-route`（MAC 还需要 `auto-redirect`）。Android 用户与包名规则仅在 Android 下被支持，且需要 `auto-route`。常用用户 ID 文档列出：机主 0、手机分身 10、应用多开 999。

记录时应写成「系统 + 已启用的限制字段 + 栈」，而不是只写栈名。例如 Linux 上启用 `auto-redirect` 的 `mixed`，与未启用该字段的 `mixed`，是两套组合。`congestion-controller` 仅 mips 生效，非 mips 行不要把拥塞算法算作有效组合的一部分。

## 用失败原因和并列项补全档案

`inet6-address` 会在启动时检查系统其他网卡是否有 IPv6，不存在会禁用；若要强制开启需环境变量 `SKIP_SYSTEM_IPV6_CHECK=1`，且顶层 `ipv6` 为 true 才生效。`dns-hijack` 在 MacOS/Windows 无法自动劫持发往局域网的请求，Android 开启私人 DNS 也无法自动劫持。`strict-route` 在 Linux 与 Windows 行为不同，Windows 上还写明可能影响 VirtualBox 一类程序。`route-address-set` 与 `route-exclude-address-set` 仅 Linux，且需要 nftables 以及 `auto-route`、`auto-redirect`，并与 `routing-mark` 冲突。

维护步骤：每台机器建一行模板，先填系统与防火墙，再填实际用过的 `stack`，然后勾选当时启用且确被文档支持的字段，最后写失败现象（无法启用、DNS 未劫持、IPv6 被禁用等）。失败时下一步：对照该行缺少的前置条件（防火墙、utun 前缀、Linux 专属项、Android `auto-route`）；不要把某一系统上的成功组合直接复制到另一系统。档案只记录文档允许的组合与当时条件，不把未验证的栈填成可用。

资料：https://wiki.metacubex.one/config/inbound/tun/
