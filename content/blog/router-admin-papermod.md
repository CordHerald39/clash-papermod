---
{
  "title": "Clash 网络设备换地址后怎样更新相关例外",
  "description": "Clash 网络设备换地址后怎样更新相关例外。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.875175+00:00",
  "lastmod": "2026-10-04T21:38:12.875175+00:00",
  "type": "post"
}
---

网络设备更换 IPv4 或 IPv6 地址后，TUN 里按网段、接口或 MAC 写的例外可能不再覆盖真实流量。下面只说明：在何种条件下需要改例外、如何判断改哪一类字段，以及改完仍异常时如何继续排查。依据为 Tun 入站配置说明。

## 适用条件

只有 `tun` 已 `enable`，并且打开了 `auto-route`（自动将全局流量导入 TUN 网卡）时，地址相关例外才会参与路由结果。`auto-redirect` 仅支持 Linux，且需要 `auto-route` 已启用。在 Android 中，该组合仅转发本地 IPv4 连接。Linux 上 `route-address-set` 与 `route-exclude-address-set` 还要求 nftables，并且与任意配置中的 `routing-mark` 冲突。

若文件从未声明 `route-exclude-address`、`route-address`、旧版 inet 路由键、接口限制或 MAC 限制，则不存在可更新的例外清单，应先确认这些键是否被省略。`device` 只指定 TUN 网卡名称，MacOS 只能使用 utun 开头的网卡名，与局域网主机换地址无关，不能当作例外去改。

## 判断该更新哪一类例外

按“流量为什么被排除”分类，避免把地址变化改到 UID 或应用包名上。

目标网段类：启用 `auto-route` 时，`route-exclude-address` 排除自定义网段，说明中的示例包括 `192.168.0.0/16` 与 `fc00::/7`；`route-address` 用于路由自定义网段而不是默认路由，一般无需配置。若设备从 `192.168.0.0/16` 迁到其他前缀，旧排除不再命中，必须按新 CIDR 增删条目。即将废弃的旧写法包括 `inet4-route-address`、`inet6-route-address`、`inet4-route-exclude-address`、`inet6-route-exclude-address`。文件若仍使用旧键，换地址时应确认是否已迁到 `route-exclude-address` / `route-address`，否则会出现只改新键、实际仍读旧键的偏差。

Linux 上例外若来自规则集：`route-address-set` 将指定规则集中的目标 IP CIDR 添加到防火墙，不匹配的流量将绕过路由；`route-exclude-address-set` 则让匹配的流量绕过路由。此时应更新规则集内容或集合名，而不是只改 YAML 里的静态列表。

来源接口与 MAC 类：`include-interface` 限制被路由的接口，`exclude-interface` 排除路由的接口，二者冲突、不可一起配置。网卡改名或多网卡切换出口时，应改接口名而不是 IP。`auto-detect-interface` 会自动选择流量出口接口，多出口网卡同时连接的设备建议手动指定出口网卡。换地址常伴随默认出口变化，应先确认出口，再核对排除网段。`include-mac-address` 与 `exclude-mac-address` 按来源 MAC 地址限制或排除局域网设备，仅支持 Linux，且需要启用 `auto-route` 和 `auto-redirect`。只变更 IP、MAC 不变时，这两项不必改。

身份类限制通常与换地址无关：`include-uid`、`exclude-uid` 及对应 range 仅在 Linux 下被支持并且需要 `auto-route`；`include-android-user`、`include-package`、`exclude-package` 仅在 Android 下被支持并且需要 `auto-route`。常用用户 ID 包括机主 `0`、手机分身 `10`、应用多开 `999`。不要用改 UID 或包名来适配局域网地址变化。

IPv6 还要看 `inet6-address`。启动时会检查系统其他网卡是否有 IPv6，如果不存在会禁用该功能；若需强制开启 tun 的 v6 地址，须设置 `SKIP_SYSTEM_IPV6_CHECK=1`，并同时将顶层 `ipv6` 设为 true。设备 IPv6 前缀变化后，要同时核对排除列表与系统是否仍具备 IPv6。

`strict-route` 在启用 `auto-route` 时执行严格的路由规则。在 Linux 中会让不支持的网络无法到达、将所有连接路由到 tun。在 Windows 中会添加防火墙规则以阻止普通多宿主 DNS 解析行为造成的 DNS 泄露，也可能使某些应用程序在某些情况下无法正常工作。换地址后若出现网段不可达或解析异常，应复核该开关是否仍适合当前拓扑。

## 更新步骤与失败时下一步

第一步，确认 `enable` 与 `auto-route`；Linux 场景再确认 `auto-redirect` 与 nftables 是否满足规则集例外的前提。第二步，列出文件中的网段例外、旧 inet 键、规则集例外、接口列表与 MAC 列表，标明每条属于目标 CIDR、来源接口还是来源 MAC。第三步，用设备的新地址判断：新地址已离开原排除 CIDR 则改网段类；只换网卡名则改接口类，且不要同时写入 `include-interface` 与 `exclude-interface`；只换 IP 且 MAC 未变则保持 MAC 例外。第四步，不要用修改 `device`、UID 或包名来适配局域网换地址。

若改完后本该绕过 TUN 的流量仍进入：检查掩码是否过窄、新地址是否未写入排除、是否仍依赖未迁移的旧键、规则集例外是否因缺少 nftables 或与 `routing-mark` 冲突而未生效。若本该进入 TUN 的流量消失：排除网段是否过宽、`strict-route` 是否把新拓扑判成不可达。若仅 IPv6 例外无效：核对系统网卡 IPv6、上述环境变量与顶层 `ipv6`。修改以配置字段为准。

https://wiki.metacubex.one/config/inbound/tun/
