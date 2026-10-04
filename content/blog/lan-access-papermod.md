---
{
  "title": "Clash 停止共享代理后怎样收回相关设置",
  "description": "Clash 停止共享代理后怎样收回相关设置。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:59:37.577439+00:00",
  "lastmod": "2026-10-04T18:59:37.577439+00:00",
  "type": "post"
}
---

停止把本机 Clash（mihomo）共享给局域网之后，需要把入站相关项收回，而不是只断开对端设备的代理设置。官方全局配置里，和其他设备经过代理端口访问互联网直接相关的是 `allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`，以及代理认证；若共享期间还扩大过外部控制 API 监听，也应一并收回。下面按「先关总开关、再收绑定与网段、最后收认证和 API」说明适用条件、操作和判断依据。

## 先收回「允许其他设备使用代理端口」

适用条件：此前为了让其他设备走本机代理，曾把 `allow-lan` 设为 `true`，现在不再提供这项能力。

操作步骤：

1. 在当前配置中将 `allow-lan` 改为 `false`。该项可选 `true`/`false`，文档定义是允许其他设备经过 Clash 的代理端口访问互联网。
2. 保存并重新加载配置，使运行中的内核使用新值。
3. 不要只删除对端手机或电脑上的代理主机记录，就认为本机已经停止共享；对端配置与本机入站开关是两件事。

判断依据：`allow-lan` 为 `false` 后，局域网设备不应再被允许使用这些代理端口。若该项仍为 `true`，即使你主观上「已经不用了」，访问范围在配置层面仍是开放的。

失败时下一步：确认进程加载的就是这份已改为 `false` 的配置。若仍能从其他设备连上代理端口，先核对该项实际值，再进入绑定地址是否仍对外监听的检查，而不是先改规则模式 `mode`。

## 再收回绑定地址和网段名单，避免下次误开时范围过大

适用条件：共享期间改过 `bind-address`、收紧或放宽过 `lan-allowed-ips`，或写过 `lan-disallowed-ips`。停止共享后这些值不会自动回到文档默认，需要你显式处理。

文档要点：

- `bind-address`：仅允许其他设备通过这个地址访问。`"*"` 绑定所有 IP；也可为单个 IPv4 或单个 IPv6。
- `lan-allowed-ips`：仅作用于 `allow-lan` 为 `true`，默认 `0.0.0.0/0` 和 `::/0`。
- `lan-disallowed-ips`：黑名单优先于白名单，默认空。

操作步骤：

1. 若共享时把 `bind-address` 写成 `"*"` 或某块局域网地址，停止共享后按你的后续用途改回更小范围。不再对外提供代理时，不必继续绑在全部地址上。
2. 若曾把 `lan-allowed-ips` 写成较大网段以便多台设备接入，停止共享后可恢复为你原本需要的列表，或回到文档默认值并依赖 `allow-lan: false` 关闭能力。
3. 若曾用 `lan-disallowed-ips` 单独排除某台设备，评估该例外是否还需要；黑名单在总开关重新打开时仍会生效。
4. `ipv6` 若仅为共享而改过，对照是否仍要内核接受 IPv6 流量（可选 `true`/`false`，默认 `true`），避免把与共享无关的 IPv6 行为留在配置里。

判断依据：`allow-lan` 为 `false` 时，`lan-allowed-ips` 不作用于放行其他设备，但绑定地址和名单会在下次设回 `true` 时立即生效。因此「停止共享」若只关总开关、不整理绑定与名单，属于收回不完整。

失败时下一步：把这三项的当前值与共享前的目标值列表对照。发现仍是 `"*"` 或过宽网段时，先改配置再加载。不要用改 `find-process-mode` 或出站 `interface-name` 来代替收回入站范围。

## 收回代理认证与外部控制监听，避免入口残留

适用条件：共享期间启用过 `authentication`、扩大过 `skip-auth-prefixes`，或把 `external-controller` 从本机回环改成监听所有 IP。

文档中，`authentication` 用于 http(s) / socks / mixed 的用户验证；`skip-auth-prefixes` 为允许跳过验证的 IP 段，示例为 `127.0.0.1/8` 和 `::1/128`。`external-controller` 为 API 监听地址，可将 `127.0.0.1` 改为 `0.0.0.0` 以监听所有 IP；另有 TLS、Unix socket、named pipe 等入口，其中 Unix socket 与 named pipe 访问 API 不会验证 `secret`。

操作步骤：

1. 若认证只为局域网共享而设，停止共享后删除或停用 `authentication` 列表，避免本机其他客户端被突然要求凭据；若仍要保留认证，把 `skip-auth-prefixes` 收回为仅本机回环一类前缀，不要留下整个局域网可跳过验证。
2. 若共享时为了远程面板把 `external-controller` 改成 `0.0.0.0` 或非本机地址，停止共享后改回 `127.0.0.1` 及所需端口。API 与代理端口是不同入口，只关 `allow-lan` 不会自动把 API 收回到本机。
3. 若曾启用 `external-controller-tls`、`external-doh-server` 等，对照文档中「不会验证 secret、需自行保证安全」的说明，停止对外提供时关闭或改回仅本机可达。
4. 重新加载后，分别确认：其他设备不能再使用代理端口；API 仅在你期望的地址可达。

判断依据：对端代理失败而 API 仍可从局域网访问，说明代理侧已收回、外部控制未收回。本机代理客户端突然需要密码，说明认证项未按停止共享的目标清理。`skip-auth-prefixes` 仍包含局域网段时，一旦有人再次打开 `allow-lan` 并知道端口，认证会被跳过。

失败时下一步：按「`allow-lan` → `bind-address` 与网段 → `authentication`/`skip-auth-prefixes` → `external-controller`」逐项读回配置。任一项仍保持共享期的对外写法，就继续改该项并重新加载，直到与「不再向其他设备提供代理端口、也不额外暴露 API」的目标一致。

https://wiki.metacubex.one/config/general/
