---
{
  "title": "Clash 修改端口后怎样更新浏览器与工具配置",
  "description": "Clash 修改端口后怎样更新浏览器与工具配置。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:59:37.578391+00:00",
  "lastmod": "2026-10-04T18:59:37.578391+00:00",
  "type": "post"
}
---

修改 Clash 的监听端口之后，浏览器、系统代理和其他工具不会自动跟随配置文件。适用条件是：已经改了代理端口、`bind-address` 或 `external-controller` 等全局项，并且内核能够绑定新地址，需要让客户端改连新的入口。

## 分清改的是代理端口还是控制端口

资料把代理端口和外部控制分成两条线。浏览器、系统代理、命令行工具使用的是 http(s) / socks / mixed 代理端口，并受 `allow-lan` 与 `bind-address` 约束。`bind-address` 为 `*` 时，其他设备可以使用本机各地址上的代理端口；绑定单一 IPv4 或 IPv6 时，客户端必须填写那个地址，不能随意改成另一块网卡的 IP。`allow-lan` 为 false 时，其他设备即使知道新端口也不能把 Clash 当作入口，此时只需更新本机工具，更新局域网浏览器没有意义。

若修改的是 `external-controller`（示例 `127.0.0.1:9090`）或 `external-controller-tls`（示例 `127.0.0.1:9443`），需要更新的是面板和调用 RESTful API 的工具。资料说明外部用户界面运行在 Clash API 上，路径为 API 地址加 `/ui`，因此改控制端口后，打开界面的主机和端口都要改。`external-ui`、`external-ui-name`、`external-ui-url` 只决定静态文件放在哪、从哪下载；若路径不在工作目录，还需按资料要求设置 `SAFE_PATHS`，但这不能替代端口更新。Unix socket 与 named pipe 没有主机端口，依赖它们的工具要改路径，且这两类访问不会验证 secret。

## 浏览器与局域网工具如何对齐新地址

具体操作如下。第一，从当前配置抄出新的代理端口、`bind-address` 以及 `allow-lan` 的值。第二，本机浏览器或系统代理的主机应写成实际能连上的地址：绑定环回地址时不要填局域网 IP；绑定具体网卡 IP 时不要填其他主机。第三，若启用了 `authentication`，工具里要同步用户名和密码；`skip-auth-prefixes` 列出可跳过验证的 IP 段（资料示例包含 `127.0.0.1/8` 与 `::1/128`），本机环回访问可能仍免密，但局域网浏览器不在该段内时必须带认证。第四，局域网设备还要落在 `lan-allowed-ips` 内，且不被 `lan-disallowed-ips` 排除。只改端口却把客户端 IP 留在黑名单里，会表现为端口已经改对仍然连不上，判断依据是连接被策略拒绝，而不是浏览器自身缓存了旧菜单名称。

`mode` 仍为 rule、global 或 direct，改端口不会改变模式；不要指望只改浏览器代理就能绕过 `direct`。`ipv6` 为 false 时，不要把客户端代理主机改成仅有 IPv6 的字面量。出站项如 `interface-name`、`unified-delay` 与本次客户端端口对齐无关。

## API、界面更新失败时下一步

控制类工具应改到新的 `external-controller` 或 TLS 地址，并带上 `secret`。CORS 由 `external-controller-cors` 配置；若浏览器面板从新的页面源访问 API 被拦截，应检查允许的 origins 以及 `allow-private-network`，而不是退回旧端口。`external-doh-server` 开在 RESTful API 端口上，DOH 客户端的 URL 主机和端口要随 API 一起改，该 URL 不会验证 secret。使用 `external-controller-tls` 时，客户端还要能使用 `tls` 段中的证书，且资料要求 TLS 与 `external-controller` 同时存在。

失败时下一步：先确认内核已在新地址监听，再改客户端，避免两端同时改乱。若本机能用、局域网不能用，核对 `allow-lan`、`bind-address`、`lan-allowed-ips` 与认证，而不是改 `log-level`。若面板能打开但代理无效，说明控制端口已更新，代理端口或认证尚未更新。验证是否更新成功的依据只能是：客户端指向的地址和端口与配置中的代理端口或外部控制端口一致，并且认证、允许的源地址与 `skip-auth-prefixes` 匹配。不要用 `geo-auto-update` 或策略组缓存去证明端口已经改完。

资料来源：https://wiki.metacubex.one/config/general/
