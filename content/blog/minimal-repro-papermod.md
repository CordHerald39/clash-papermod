---
{
  "title": "Clash 怎样保存原始配置与测试副本的对应关系",
  "description": "Clash 怎样保存原始配置与测试副本的对应关系。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:38:12.879191+00:00",
  "lastmod": "2026-10-04T21:38:12.879191+00:00",
  "type": "post"
}
---

在需要改动 Clash（mihomo）全局配置时，原始文件与测试副本很容易共用工作目录、策略组缓存或外部控制器。官方全局配置没有版本对照字段，对应关系只能靠文件隔离、`profile` 缓存开关、运行模式和 API 监听地址来固定。下面按适用条件、操作步骤和失败处理说明，不涉及未记载的界面名称。

## 适用条件与判断依据

当你准备改 `mode`、`log-level`、`allow-lan`、`bind-address`、`profile` 或 `external-controller`，同时又必须能回到改前行为时，需要把原始配置与测试副本成对保存。文档写明 `mode` 可选 `rule`（规则匹配）、`global`（全局代理，需要在 GLOBAL 策略组选择代理或策略）、`direct`（全局直连），且默认为规则模式。测试副本改了 `mode` 而你仍以为在跑原始规则，对应关系已经断裂。

`profile.store-selected` 为 true 时，会储存 API 对策略组的选择，供下次启动使用；`store-fake-ip` 为 true 时，会储存 fakeip 映射表，域名再次连接时使用原有映射地址。两份配置若落在同一工作目录且这两项为 true，测试启动时的策略组选中项和 fake-ip 表可能来自另一次运行，文件与运行时状态无法对应。

判断依据是三对信息都能对上：原始文件名与测试文件名；两边的 `mode`、`log-level`、`external-controller`；`store-selected` 与 `store-fake-ip` 是否仍指向同一份本地缓存。

## 用文件、缓存和监听地址绑成一对

第一步，复制完整 YAML 作为测试副本，原始文件改为只读、不再写入。在测试副本文件头用注释写明对应的原始文件名以及本次只改哪些键。官方不提供自动登记，注释和文件名就是对应表。

第二步，不要让缓存串数据。若本次不需要恢复上次 API 点选，应避免在同一目录用 `store-selected: true` 把测试选择写回或把生产选择读入。验证域名映射时同样处理 `store-fake-ip`。对应关系的关键是哪份文件加哪份缓存，不是隐藏版本号。

第三步，测试副本使用独立的 `external-controller`。文档示例为 `127.0.0.1:9090`。两套配置写同一地址时，RESTful API 无法区分连的是原始还是副本。`secret` 也应分开。从 Unix socket 或 Windows namedpipe 访问 API 不会验证 secret，测试若开启 `external-controller-unix` 或 `external-controller-pipe`，路径必须与生产错开。

第四步，用日志级别给副本做可分辨标记。`log-level` 可选 silent、error、warning、info、debug。测试用 info 或 debug，原始用 warning 或 error，输出范围不同即可辅助确认加载的是哪份。它只决定输出等级。

第五步，`external-ui` 路径可为绝对路径或工作目录相对路径；若不在工作目录，需设置 `SAFE_PATHS` 环境变量。测试与原始的界面目录应分开，避免打开的界面服务于另一份配置。

## 失败时的下一步

策略组选中项与测试文件不一致：先查 `store-selected` 与是否共用工作目录。API 连上后 `mode` 不是文件里的值：确认进程加载的文件，并核对漏写 `mode` 时是否落到默认规则模式。日志不符合预期：查是否为 silent。局域网行为异常：核对 `allow-lan`、`bind-address`、`lan-allowed-ips` 与 `lan-disallowed-ips`（黑名单优先于白名单）。界面或证书加载失败：查 `external-ui`、`SAFE_PATHS` 以及 `tls` 证书路径是否指向当前副本。

对应关系不是内核自动维护的清单，而是只读原始文件、独立测试文件、缓存不混用、控制器地址不冲突。缺任何一项就应停止改配置，先把这四项对上再继续。

资料：https://wiki.metacubex.one/config/general/
