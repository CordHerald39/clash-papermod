---
{
  "title": "Clash 更新前后怎样记录客户端与 Mihomo 内核版本",
  "description": "Clash 更新前后怎样记录客户端与 Mihomo 内核版本。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:34:48.388057+00:00",
  "lastmod": "2026-10-04T18:34:48.388057+00:00",
  "type": "post"
}
---

更新 Clash 封装或 mihomo 内核前后，若不留下可对照的记录，出现行为变化时只能争论“是不是更新导致的”。公开的全局配置说明没有给出更新器操作步骤，但给出了更新真正可能改变的内核项和版本门槛。记录应围绕这些项，而不是只保存一个界面上的数字。

## 适用条件与记录目标

适用于计划更换安装包、替换内核二进制、改 `external-ui-url` 拉取新仪表板、或调整 GEO 自动更新之前。目标有三：证明更新前内核按哪些键运行；证明更新后是否跨过手册中的能力门槛；把外壳自称版本与内核能力分开存放。本页不描述任何客户端的升级按钮，因此不要把“点了更新”写成已完成内核升级的证据。

若当前看不到 YAML，先不要更新；没有更新前快照，更新后无法判断是内核字段变了，还是只有 `/ui` 网页被替换。

## 更新前按手册字段做快照

将下列内容复制到文本（可附原 YAML 片段），每条都是后续对照依据：

- 外壳自称版本与启动方式，单独一行，标明未在该手册验证。
- 内核运行参数：`mode`、`log-level`、`ipv6`、`find-process-mode`、`allow-lan` 及相关绑定与 IP 段、验证与 `skip-auth-prefixes`。
- 外部控制：`external-controller`、CORS、`secret`、Unix socket、namedpipe、`external-controller-tls`、是否启用 `external-doh-server`。注明当时实际使用的访问通道，因为 socket/pipe/DoH 路径不验证 secret，更新后若改走 TCP+secret，现象会变。
- 界面资源：`external-ui` 路径、`external-ui-name`、`external-ui-url`。手册写明未配置名字则更新到 `external-ui` 目录，配置了则更新到指定子目录。这决定你更新的是网页资源还是别的东西。
- GEO 与下载：`geodata-mode`、`geodata-loader`、`geo-auto-update`、`geo-update-interval`、`geox-url` 四类地址、`global-ua`、`etag-support`。更新内核后这些默认值或加载器行为可能被拿来比较，快照缺失就无法解释 GEO 变化。
- 出站与 TLS：`interface-name`、`routing-mark`、`tls` 三段材料是路径还是 PEM、是否依赖本地文件自动重载。
- 缓存：`profile.store-selected` 与 `store-fake-ip`。更新后策略组选择或 fakeip 映射“丢失”，需要知道更新前是否本来就未持久化。
- 已弃用写法：是否仍在全局设置指纹。更新后若该项失效，依据是手册要求改到 proxy 内，不一定是更新失败。

平台强制项必须写入快照：Android 上 Keep Alive 禁用为强制 true；Linux 才有 routing-mark；路由器推荐关闭进程匹配。

## 更新后用版本门槛核对内核，而不是核对窗口

更新完成后，不要先看界面是否换皮，先核对手册中的硬门槛。需要本地证书/私钥/ECH 密钥自动重载时，确认内核是否达到 v1.19.18，且三项确为本地文件。未达门槛则记录“本次更新未获得该能力”，即使外壳版本号变大。证书路径不在工作目录时，仍需 `SAFE_PATHS`；缺少该环境变量时，应判为路径安全策略，而不是版本没升上去。

接着用同一份键名做 diff：`mode` 默认是否仍为规则模式、日志是否仍只出现在控制台和控制页面、`geodata-loader` 是否仍符合当前内存场景、`global-ua` 是否仍为 clash.meta 或你的自定义值。`external-ui-url` 若指向新的网页压缩包，只能证明 API `/ui` 资源更新，不能证明 mihomo 内核已替换。把仪表板更新写成内核更新，会导致以后无法回滚真正出问题的那一层。

## 记录对不上或更新后异常时的下一步

若外壳版本变了、YAML 键与手册仍完全一致，将事件记为“仅封装或界面资源变化”。若 YAML 未改但证书热重载从无到有或从有到无，按 v1.19.18 门槛记录内核世代变化。若更新后日志消失，先看 `log-level` 是否变成 silent，再在控制台和控制页面查找，不要假设新增了未写入该页的日志位置。API 突然能免密钥访问，核对是否改用了 Unix socket、namedpipe 或 DoH 路径。GEO 或外部资源异常，对照快照中的 `geox-url`、`etag-support` 与 UA。仍无法解释时，保留更新前后两份字段列表，停止用单一版本号概括，把问题限定到具体键后再处理。

https://wiki.metacubex.one/config/general/
