---
{
  "title": "Clash 电脑端：怎样整理浏览器扩展中的旧代理地址",
  "description": "Clash 电脑端：怎样整理浏览器扩展中的旧代理地址。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.866291+00:00",
  "lastmod": "2026-10-04T21:38:12.866291+00:00",
  "type": "post"
}
---

## 适用条件

浏览器扩展里保存的代理主机，对应的是 Clash 内核入站，也就是全局配置中与 http(s)、socks、mixed 相关的一侧，而不是出站节点或策略组名称。需要整理旧地址的条件包括：bind-address 从绑定全部地址改成了单个 IPv4 或单个 IPv6；allow-lan 从 true 改为 false；authentication 从空变为 user:pass 列表；skip-auth-prefixes、lan-allowed-ips 或 lan-disallowed-ips 有增减；ipv6 从默认 true 改为 false。上述变化都会让扩展里仍保存的历史主机变成过期数据。本篇只依据这些字段判断，不引入未在文档出现的客户端菜单名称，也不把外部控制接口当成浏览器代理。

## 按字段清理扩展中的旧条目

第一步，读取 allow-lan，取值只能是 true 或 false。为 true 时，其他设备才被允许经过代理端口访问互联网；为 false 时，扩展里指向邻居主机、旧网卡或已失效局域网地址的条目应删除，只保留本机可到达的入站。第二步，读取 bind-address。文档允许用星号绑定所有 IP，也可绑定单个 IPv4 或单个 IPv6。扩展的主机必须落在当前绑定范围内；指向未再监听地址的行判定为旧地址。第三步，读取 authentication。每一项是用户名与密码组合，作用于 http(s)/socks/mixed。扩展仍以无认证方式连接时，只有源地址落在 skip-auth-prefixes 内才可能被放行；文档给出的可跳过网段包括 127.0.0.1/8 与 ::1/128。局域网浏览器通常不在该范围，必须改为携带同一组账号，或删除该条目。第四步，读取 lan-allowed-ips 与 lan-disallowed-ips。白名单仅在 allow-lan 为 true 时生效，默认 0.0.0.0/0 与 ::/0；黑名单优先且默认空。命中禁止段的扩展地址应停用。第五步，在扩展列表中去掉重复项和历史主机，只保留与当前绑定、认证、网段同时一致的一条，避免客户端按顺序回退到过期地址。

判断是否属于旧地址，只看它能否映射到当前入站的绑定、认证与网段，不看它过去是否成功。该全局页并未给出固定端口数字，因此不能凭印象保留历史端口；主机已不在 bind-address 范围内即可删除。

## 失败时的判断依据与下一步

清理后仍失败，将 log-level 调到 info 或 debug。silent 不输出，error 只保留无法使用级别，warning 还包含不影响运行的错误；要判断是否连到错误的旧入站，需要比 error 更完整的控制台记录。接着核对 mode：默认 rule 为规则匹配；global 为全局代理，且需要在 GLOBAL 策略组选择代理或策略；direct 为全局直连。扩展显示已连接但页面仍像直连时，先排除 mode 为 direct，以及 global 下未选择节点。find-process-mode 取 always、strict 或 off，只控制是否匹配进程，不能解释扩展填错主机。不要把 external-controller（文档示例为 127.0.0.1:9090）、Unix socket、Windows namedpipe 或 TLS API 填进浏览器代理栏；这些接口使用 secret，且 socket 与 namedpipe 访问不验证 secret，它们不是 mixed/http/socks 入站。ipv6 为 false 时删除扩展中的 IPv6 字面量。若 allow-lan 已为 true 仍被拒绝，检查是否只绑定了另一地址，以及 lan-disallowed-ips 是否覆盖浏览器所在主机。

https://wiki.metacubex.one/config/general/
