---
{
  "title": "Clash 没有改善时怎样回退 MTU 修改",
  "description": "Clash 没有改善时怎样回退 MTU 修改。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T19:25:01.102448+00:00",
  "lastmod": "2026-10-04T19:25:01.102448+00:00",
  "type": "post"
}
---

修改 TUN 的 mtu 之后如果没有出现与极限状态下速率相关的改善，就应回到文档“一般用户默认即可”的立场执行回退。官方没有对调整效果作出任何承诺，回退的目的是让配置重新符合已写明的建议，并排除因单字段改动引入的不确定性。回退只动 mtu，其余已记录的字段保持原样。

## 确认回退适用并恢复原始 mtu 写法
适用条件是已经改过 mtu，且观察后没有对应到文档所说的极限速率变化。操作步骤是编辑 YAML，把 mtu 改回修改前的数字，或者直接删掉 mtu 键以恢复默认。判断依据就是文档把该参数定位为非一般用户必需。回退前先备份当前（已改过的）整段 tun 配置，确保 stack、auto-route、gso、strict-route、device、dns-hijack 等不被顺手改掉。若当初是从默认改成示例里的 9000 一类数值，回退即回到未写状态。

## 使回退生效时需要核对的平台与路由项
保存文件后重新加载或重启进程。Linux 上确认 iproute2-table-index 与 rule-index、auto-redirect、nftables 相关的 route-address-set 未因这次回退而错乱（mtu 单独回退通常不应改这些，但仍需核对）。Windows 与 MacOS 检查防火墙允许列表是否仍符合文档对内核或签名应用的说明。Android 核对 include-android-user、include-package 等过滤是否原样。判断回退完成的依据是配置重新贴近“默认即可”，并且现象至少回到修改前的水平。同时看 inet6-address 是否再次被系统 IPv6 检查关掉，必要时才考虑文档提到的环境变量与顶层 ipv6。

## 回退后现象仍在时的下一步排查方向
若回退后原现象还在，说明它本来就很可能不是 mtu 造成的。下一步转向文档中的其他项：按防火墙情况改用可用的栈、把 auto-detect-interface 改为手动指定出口、检查 dns-hijack 在局域网或私人 DNS 下的失效条件、评估 endpoint-independent-nat 与 congestion-controller、核验 include/exclude 接口及 uid/mac/包名是否把流量绕开 TUN、确认自定义网段与规则集写法没有冲突。不要在回退完成后再去盲目改 mtu。把修改、观察、回退的配置文本保存下来，继续只对照官方已列出的字段说明排查。

资料来源：https://wiki.metacubex.one/config/inbound/tun/
