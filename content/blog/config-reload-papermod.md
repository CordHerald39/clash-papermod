---
{
  "title": "Clash 怎样安排修改步骤以便逐项回退",
  "description": "Clash 怎样安排修改步骤以便逐项回退。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:59:37.569750+00:00",
  "lastmod": "2026-10-04T18:59:37.569750+00:00",
  "type": "post"
}
---

本页没有逐步撤销向导。能够逐项回退的前提是：每次只改一类全局项，并且你知道删掉该键之后会回到哪一条缺省。把控制面、入站验证、运行模式、出站标记和 GEO 写进同一次保存，失败时将无法判断该恢复哪一段。profile 缓存还不在 YAML 里，回退文件不等于回退 API 选择。

## 适用条件

适用于仍能编辑 YAML、并能接受「一次只改一组键」的维护方式。适用于本页列出的全局项。不适用于依赖未记载的重载事务或自动快照。Android 上 disable-keep-alive 强制为 true，该项不要纳入回退试验。已弃用的全局 TLS 指纹不要当作可回退项，应改为在 proxy 内设置。

## 按入口风险分组，而不是按兴趣分组

第一组是控制面：external-controller、external-controller-tls、secret、tls 证书与私钥。它们决定你还能不能用 API。这一组改完并确认仍能按 secret 访问之后，再动其他组。Unix socket 与 namedpipe 不验证 secret，不要把「打开它们以便回退」当成步骤。

第二组是谁可以使用代理端口：allow-lan、bind-address、lan-allowed-ips、lan-disallowed-ips、authentication、skip-auth-prefixes。黑名单优先，因此 lan-disallowed-ips 应最后加、最先删。skip-auth-prefixes 只表示这些地址段可跳过验证，不能代替把 bind-address 改回已知值。

第三组是观察与模式：log-level 与 mode。log-level 改成 silent 会使控制台和控制页面不再输出，后续步骤将失去本页提供的唯一观察通道，故不宜作为第一步。mode 缺省为 rule；改成 global 还依赖 GLOBAL 策略组中的选择，而该选择在 store-selected 为 true 时会留到下次启动，回退 mode 键本身不够。

第四组是出站与 GEO：interface-name、routing-mark、geodata-mode、geodata-loader、geo-auto-update、geox-url。它们不恢复 API 连通性，应在入口稳定之后再改。external-ui 路径离开工作目录时必须先处理 SAFE_PATHS，否则回退其他键也无法加载该路径上的界面资源。

## 用缺省值和缓存分界来设计回退点

find-process-mode 缺省 strict，ipv6 缺省 true，geodata-mode 缺省 false，lan-allowed-ips 缺省全网段，lan-disallowed-ips 缺省空。把自定义值改回缺省的方法是删除该键，而不是写一个本页未出现的「重置」项。store-selected 与 store-fake-ip 为 true 时，回退 YAML 不会自动清掉已储存的策略组选择和映射表；若回退目标包含「忘掉上次 API 选择」，需要单独对待这两项，不能只还原 mode 或代理相关键。unified-delay 与 tcp-concurrent 彼此独立，不要与入口键绑在同一次修改里。

## 失败时下一步

只撤销最近一组键，恢复为改前取值或本页缺省，不要把四组一起还原后再猜是哪一组导致失败。控制面已丢失时，优先恢复监听地址、secret 和 tls 本地文件内容；证书文件自 v1.19.18 可自动重载，错误内容会持续影响 HTTPS-API。确认 log-level 不是 silent 且输出等级与字段一致后，再进入下一组。GEO 自动更新间隔内的数据变化不要当成某一步 YAML 回退失败。

资料来源：
https://wiki.metacubex.one/config/general/
