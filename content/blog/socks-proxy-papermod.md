---
{
  "title": "Clash 怎样记录应用专用代理以便换设备恢复",
  "description": "Clash 怎样记录应用专用代理以便换设备恢复。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:59:37.575388+00:00",
  "lastmod": "2026-10-04T18:59:37.575388+00:00",
  "type": "post"
}
---

## 适用条件：换设备时要带走的是全局配置本身

所谓「记录应用专用代理以便换设备恢复」，在官方全局配置里主要指：把决定应用如何连入、如何被验证、以及策略组选择如何在重启后复原的那些项，连同配置文件一起保存。文档提供 `profile.store-selected` 用于储存 API 对策略组的选择，供下次启动使用；`store-fake-ip` 储存 fakeip 映射。应用要填写的主机、是否带账号，则取决于 `allow-lan`、`bind-address`、`authentication` 与 `skip-auth-prefixes`。换设备后网卡地址、回环与局域网范围往往会变，只记住「用过 SOCKS」而不记录这些项，无法按原样恢复。

适用场景包括：从电脑迁到另一台电脑、迁到路由器、或同一套配置要在新主机上继续给若干应用使用。外部用户界面路径、API 监听地址也属于应一并记录的运行面，但它们不等于代理端口本身。

## 应记录的项目、操作步骤与判断依据

第一步，完整保存当前全局配置中与入站访问有关的键。至少包括：`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`、`authentication`、`skip-auth-prefixes`、`ipv6`、`mode`。判断依据：新设备上应用填写的主机必须能命中新的绑定地址；若新环境不允许局域网设备接入，`allow-lan` 不能想当然保持 true。黑名单优先级高于白名单，迁移动后源 IP 变化时要重算，而不是原样粘贴一份过期网段。

第二步，单独记录验证与跳过验证的对应关系。`authentication` 为 `user:pass` 列表，作用于 http(s)/socks/mixed；`skip-auth-prefixes` 文档示例为 `127.0.0.1/8` 与 `::1/128`。判断依据：新设备上应用若仍走回环，可继续跳过验证；若改为局域网 IP 访问，源地址一旦离开跳过前缀，应用里就必须填写与列表一致的用户名口令。口令只存在配置中，换设备时漏拷这一段，应用侧会表现为「以前能连、现在不能连」。

第三步，记录策略组选择的持久化开关。`profile.store-selected: true` 时，API 对策略组的选择会被储存，下次启动继续使用。判断依据：依赖 API 或外部用户界面为某个应用相关流量选定过 GLOBAL 或其他组时，关闭该项会导致换设备或重启后选择丢失。`store-fake-ip` 只恢复 fakeip 映射，不能代替策略组选择，也不应当成「应用专用代理」的唯一备份。

第四步，记录控制面与界面路径，避免把它们当成应用代理。`external-controller`、`secret`、`external-ui`（可为绝对路径或工作目录相对路径）用于控制内核和承载静态网页。文档注明：若路径不在工作目录，需设置 `SAFE_PATHS` 环境变量加入安全路径，语法同各操作系统 PATH。判断依据：新系统盘符或目录结构不同，界面路径失效只影响控制页面，不自动等于 SOCKS 入口失效；但若有人把 API 地址记成应用专用代理，换设备后会连错端口角色。

## 换设备恢复顺序与失败时下一步

恢复顺序建议为：先放入同一份全局配置并确认 `mode`、IPv6、进程匹配（`find-process-mode` 在路由器上文档推荐 off）→ 按新主机改 `bind-address` 与局域网名单 → 确认应用源 IP 与 `skip-auth-prefixes`、`authentication` 的关系 → 再确认 `store-selected` 已带回策略组选择 → 最后让应用填写新的可达绑定地址，而不是旧机器的地址。`log-level` 在恢复阶段可设为 info 或 debug，便于在控制台或控制页面看到认证与拒绝原因。

若新设备上应用仍连不上：优先检查绑定地址是否仍写着旧 IPv4/IPv6、`allow-lan` 是否与新拓扑一致、源 IP 是否落入 `lan-disallowed-ips`。若能连上但策略与旧机不同，检查 `store-selected` 是否为 true、以及 global 模式下 GLOBAL 组是否已有选择。不要把 `unified-delay`、`tcp-concurrent`、GEO 下载地址当成应用专用代理的恢复项；它们不决定应用应填写的 SOCKS 主机与账号。

https://wiki.metacubex.one/config/general/
