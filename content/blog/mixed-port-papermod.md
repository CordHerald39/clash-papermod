---
{
  "title": "Clash 改 mixed-port 前怎样检查依赖它的应用",
  "description": "Clash 改 mixed-port 前怎样检查依赖它的应用。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:59:37.576427+00:00",
  "lastmod": "2026-10-04T18:59:37.576427+00:00",
  "type": "post"
}
---

修改 mixed-port 会改变混合入站的监听数字，所有把该数字当作 HTTP 或 SOCKS 代理的程序都要跟着改。官方全局配置并未提供「依赖扫描」开关，因此检查必须靠配置项语义加清单：谁在用代理端口、谁其实在用外部控制器、谁走回环免验证、谁走局域网白名单。漏掉任何一类，改端口后会出现「内核已起来、个别软件仍指向旧数字」的断裂。

## 适用条件

在改 mixed-port 之前做检查，适用于这些前提。配置里确实存在 mixed 入站，且本地或局域网应用正把它当作代理入口。你能区分 `authentication`（http(s)/socks/mixed）与 API 的 `secret`。你不打算把 `external-controller` 的监听一并改掉——那是另一条依赖链。若 mixed 从未启用，或所有客户端都指向独立 HTTP/socks 入站，则不在「改 mixed-port」的检查范围内，应改去核对这些入站自己的端口。

`allow-lan` 为 true 时，检查范围必须扩大到其他设备；为 false 时，仍要检查本机回环应用，因为允许局域网与本机是否使用 mixed 不是同一件事。`skip-auth-prefixes` 默认含 `127.0.0.1/8` 与 `::1/128`，本机清单和局域网清单要分开列，避免把「免验证」写成「无依赖」。

## 检查步骤

先冻结当前 mixed 端口数字，只记录这一处，不要把文档示例里的 `127.0.0.1:9090` 写进清单。然后按三张表收集依赖。表一：本机应用。凡代理主机为 `127.0.0.1` 或 `::1`、端口等于当前 mixed-port、协议为 HTTP 或 SOCKS 的，都记为直接依赖。若某应用填的是 `secret` 或 API 路径，把它移出本表，标成控制面误用，改 mixed-port 解决不了它。

表二：鉴权。列出 `authentication` 中的用户。对照 `skip-auth-prefixes`：落在前缀内的来源改端口后仍可能免验证，但必须改连接目标；被移出前缀的来源除了改端口，还要保证用户名密码仍指向代理而不是 API。表三：局域网。仅当 `allow-lan` 为 true 时填写。结合 `bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`（黑名单优先）列出哪些地址段被允许经过代理端口。这些设备上的系统代理、浏览器、下载工具若写死了旧 mixed-port，都属于依赖。

不要把下列对象算进 mixed-port 依赖：外部用户界面目录 `external-ui`、API CORS、`external-controller-unix` / `external-controller-pipe`、`external-doh-server`。它们跟随控制面。`mode`、`log-level`、`ipv6`、TCP Keep Alive、进程匹配模式也不因 mixed-port 数字变化而自动失效，但 IPv6 客户端若只写了 `::1` 与旧端口，仍要进表一。

## 判断依据与改完仍失败时的下一步

可以开始改端口的依据：三张表已覆盖本机、鉴权、局域网；表中每一条都有「改完后要写的新数字」；没有任何一条把 API 示例端口当成 mixed。若表一为空、表三却有设备，说明依赖可能全在局域网，改完后只测本机不够。若表一里出现 REST 工具，应先纠正其用途，再改 mixed-port，否则你会把控制面故障算到入站头上。

改完后按表回访，而不是只看内核是否启动。应用仍连旧端口，属于清单遗漏。认证失败，查是否误把 `secret` 写进代理，或 `skip-auth-prefixes` 在改配置时被一并改动。局域网部分设备失败，按黑白名单与 `bind-address` 核对，而不是再改 `mode`。需要观察连接时把 `log-level` 从 `silent`/`error` 调整到 `info` 或 `debug`。IPv6 不通时确认 `ipv6` 仍允许接受 IPv6 流量。若只有控制页面正常，那只说明 API 仍在原 `external-controller` 上，不能当作 mixed 依赖已经迁移完成。

资料来源：https://wiki.metacubex.one/config/general/
