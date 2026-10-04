---
{
  "title": "Clash 怎样给备份加日期和版本便于回退",
  "description": "Clash 怎样给备份加日期和版本便于回退。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.874265+00:00",
  "lastmod": "2026-10-04T21:38:12.874265+00:00",
  "type": "post"
}
---

Clash 内核的全局配置用 YAML 字段描述运行行为，官方全局配置文档没有提供按日期自动备份或按版本一键回退的选项。要把备份做成可回退的版本，只能把文档里真实存在的字段当作清单：改动前生成带日期与用途标记的文件副本，回退时用同一套字段核对，而不是寻找未记载的开关。

## 适用条件与文档边界

本做法适用于直接维护 mihomo 全局配置文本，并需要在修改运行模式、日志、外部控制、GEO 或 profile 之后仍能回到上一份可运行文本的场景。文档写明的持久化只有 `profile` 下的 `store-selected`（储存 API 对策略组的选择，供下次启动使用）和 `store-fake-ip`（储存 fakeip 映射表）。这两项保存的是运行时状态，不是配置文件的历史版本，因此日期和版本只能写在副本文件名和注释里。

若还配置了外部用户界面目录，路径可以是绝对路径或工作目录的相对路径。路径不在工作目录时，需要按本操作系统的 PATH 规则设置 `SAFE_PATHS`（Windows 以分号分割，其他系统以冒号分割）。回退失败且界面资源找不到时，应先核对该环境变量和路径，而不是改路由规则。

## 给副本加日期和版本的步骤

必须在修改任何全局字段之前复制文件。第一步，把当前配置另存为独立文件，文件名同时包含日历日期和版本含义，例如用紧凑年月日表示备份时刻，用 `rule`、`debug` 或某次 GEO 调整的简称表示用途，让目录排序就能看出先后。第二步，在副本顶部用注释记录文档中的关键快照：`mode`（`rule`、`global` 或 `direct`，默认规则模式）、`log-level`、`ipv6`、`find-process-mode`、`allow-lan` 与 `bind-address`、`external-controller` 以及 `secret` 是否为空、`profile` 两项布尔值、`geodata-mode` 与 `geo-auto-update`。第三步，若使用了 `authentication`、`lan-allowed-ips` 或 `lan-disallowed-ips`，把地址段原文抄进注释；黑名单优先级高于白名单，漏记会造成回退后访问范围不一致。第四步，把副本放到工作目录之外、避免被后续编辑覆盖的位置；若依赖外部 UI 目录，按文档把该路径一并记下。

版本标记应能对应一次可解释的字段变更，例如日志从 `info` 调到 `debug`、模式从 `rule` 改为 `global`、关闭 IPv6 或把进程匹配改为 `off`。每次只改一类字段并生成新副本，回退时才能判断该恢复哪一份。

## 回退是否成功的判断依据

用副本替换当前配置并启动后，先看日志级别是否符合记录：`silent` 不输出，`error` 仅严重到无法使用的错误，`warning` 含不影响运行的错误，`info` 含一般运行内容，`debug` 尽量输出全部信息。若回退目标是规则模式，`mode` 必须是 `rule`，不能留在 `global` 或 `direct`。再核对 `allow-lan`、绑定地址和 API 监听地址是否与注释一致。

当 `store-selected` 为 true 时，策略组选择可能来自上次 API 操作而不是 YAML 字面值，因此恢复文件不等于恢复上次选择。文档还写明：从 Unix socket 或 Windows named pipe 访问 API 不会验证 `secret`。回退时若这些监听被一并恢复，安全边界会与带密钥的 HTTP API 不同，必须当作判断项。

## 失败时下一步

不要连续替换多份历史文件。先把 `log-level` 提到 `debug` 或至少 `warning`，根据控制台输出判断是绑定地址、鉴权、进程匹配还是 GEO 加载问题。`find-process-mode` 在路由器上推荐 `off`；从 `always` 或 `strict` 回退失败时，先确认当前环境是否仍需要进程匹配。GEO 则核对 `geodata-mode`、`geodata-loader`（`standard` 或默认的 `memconservative`）、`geo-auto-update` 及间隔小时数是否被新副本带偏。`external-ui` 失效时检查路径与 `SAFE_PATHS`。证书或私钥若是本地文件，文档记载自 v1.19.18 起支持自动重载，路径错误应先核对文件位置。全局 TLS 指纹已被弃用，回退全局项不会恢复该行为，客户端指纹应在 proxy 内设置。

参考资料：
https://wiki.metacubex.one/config/general/
