---
{
  "title": "Clash 排查单个应用后怎样撤销临时改动",
  "description": "Clash 排查单个应用后怎样撤销临时改动。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.865295+00:00",
  "lastmod": "2026-10-04T21:38:12.865295+00:00",
  "type": "post"
}
---

排查单个应用时，临时改动通常写在全局配置，而不是只改一条未在手册该页出现的规则。撤销的目标是：相关字段回到排查前的取值，并且正在运行的内核与磁盘文件一致。下列步骤只依据 mihomo 手册的全局配置项，不扩展到该页未记载的规则写法。

## 适用条件

你使用可编辑的 Clash / mihomo 配置，并且曾为识别某个应用改过进程匹配、运行模式、日志级别、局域网访问或出站接口。路由器场景下，手册写明进程匹配推荐 `off`，不要把桌面排查时的 `always` 留在路由器上。若只改过规则列表且该页未记载那些字段，本文不能作为撤销依据。若用过外部控制 API，还要核对运行中状态，不能只看磁盘文件。

## 应当改回的字段与判断依据

先处理 `find-process-mode`。可选值：`always` 强制匹配所有进程；`strict` 为默认，由 Clash 判断是否开启；`off` 不匹配进程，推荐在路由器使用。排查单个应用时常改成 `always`。撤销时改回原值。判断依据：桌面若原本按需匹配，应为 `strict`；不需要进程分流则为 `off`。仍停在 `always` 表示未撤销。

再处理 `mode`。默认 `rule` 为规则匹配；`global` 为全局代理，且需要在 GLOBAL 策略组选择代理或策略；`direct` 为全局直连。用全局或直连对比某应用连通性后，必须改回 `rule`。判断依据：流量是否重新按规则分流；若仍为 `global`，GLOBAL 组的选择也会影响所有应用，不能当成只动了那一个应用。

日志 `log-level` 仅输出到控制台和控制页面，含 `silent`、`error`、`warning`、`info`、`debug`。`debug` 会尽可能输出运行中所有信息。排查结束后改回 `info` 或你原来的级别。判断依据：控制页不再持续刷出调试级信息。

局域网与认证：`allow-lan` 控制其他设备能否经代理端口访问互联网；`bind-address` 绑定 `*` 或单个 IPv4/IPv6；`lan-disallowed-ips` 优先于白名单。`authentication` 与 `skip-auth-prefixes` 若曾临时取消或放行，按原值恢复。出站 `interface-name`、`ipv6`（默认 true）、`tcp-concurrent`、`unified-delay` 仅在对比时改过的，一并改回。判断依据：本机环回访问是否仍要认证、出网网卡是否仍是临时指定的那一块。

`profile.store-selected` 为 true 时，会储存 API 对策略组的选择供下次启动使用；`store-fake-ip` 储存 fakeip 映射。文件里的 `mode` 已还原，不等于策略组选中项已还原。判断依据：启动后仍停在排查时选的节点，说明保存的选择还在。

## 失败时下一步

只恢复上述字段，避免再叠加新值。应用行为仍偏了，依次看：`mode` 是否还在 `global` 或 `direct`；`find-process-mode` 是否该 `strict` 却停在 `always`，或被误改成 `off` 导致进程分流失效；`store-selected` 是否把 API 选择带进下次启动。

然后检查绑定与认证：文档中 `skip-auth-prefixes` 示例包含 `127.0.0.1/8` 与 `::1/128`，删掉后本机连代理端口也会要用户名密码。`bind-address` 绑死单地址、`interface-name` 指向临时网卡，都会表现为文件好像改回去了但应用仍异常。

若文本已还原、运行值没有，经 `external-controller`（手册示例为 `127.0.0.1:9090`）读取实际配置。Unix socket 与 Windows namedpipe 访问 API 不验证 secret，排查时若改过监听，也要改回。以运行模式、进程匹配、已保存策略组选择三项同时回到排查前，作为撤销完成的判断依据。

资料：https://wiki.metacubex.one/config/general/
