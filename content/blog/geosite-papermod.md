---
{
  "title": "Clash 怎样记录自定义补充规则避免更新丢失",
  "description": "Clash 怎样记录自定义补充规则避免更新丢失。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T21:04:06.831664+00:00",
  "lastmod": "2026-10-04T21:04:06.831664+00:00",
  "type": "post"
}
---

## 适用条件：补充规则只能落在 `rules` 里

在 MetaCubeX/mihomo 的路由规则说明中，真正会参与转发判断的只有配置里的 `rules` 列表。要把自定义补充规则记录下来、避免之后重载或改写配置时等于没写过，适用条件是：你可以直接维护这份 `rules`；补充内容能对应手册已列出的规则类型；你接受规则按从上到下的顺序匹配，列表顶部的规则优先级高于其底下的规则。该页没有记载用额外备忘、未文档化字段去“记住”规则的做法，因此所谓记录，就是把补充判断写成可解析的完整行，并放进仍会被扫描到的区间。只写在注释里、或缺类型、缺出站的片段，都不会进入匹配过程。

## 具体操作：按官方形态写成独立条目

第一步，一条规则写全类型、载荷和出站。完整域名用 `DOMAIN`，例如 `DOMAIN,ad.com,REJECT`。后缀用 `DOMAIN-SUFFIX`；手册说明 `google.com` 匹配 `www.google.com`、`mail.google.com` 和 `google.com`，但不匹配 `content-google.com`。此外可按需要选用 `DOMAIN-KEYWORD`、`DOMAIN-WILDCARD`、`DOMAIN-REGEX`、`GEOSITE`，以及 `IP-CIDR`、`IP-CIDR6`、`IP-SUFFIX`、`IP-ASN`、`GEOIP`、来源侧 IP 规则、端口与入站规则、进程路径或进程名、`NETWORK` 等。涉及目标 IP 且不希望本条触发 DNS 解析时，使用附加参数 `no-resolve`，例如 `IP-CIDR,127.0.0.0/8,DIRECT,no-resolve`。

第二步，多条件不要写成自然语言。逻辑规则格式为 `LOGIC_TYPE,((payload1),(payload2)),Proxy`，payload 必须是规则类型和其他 payload，如 `DOMAIN,google.com`。手册示例为 `AND,((DOMAIN,baidu.com),(NETWORK,UDP)),DIRECT`、`OR,((NETWORK,UDP),(DOMAIN,baidu.com)),REJECT`、`NOT,((DOMAIN,baidu.com)),PROXY`。引用规则集合用 `RULE-SET,providername,proxy`，并需配置 `rule-providers`。进入子规则用 `SUB-RULE,(NETWORK,tcp),sub-rule`，同样要注意括号。

第三步，把上述完整行插在 `MATCH` 之前。`MATCH` 匹配所有请求、无需条件，例如 `MATCH,auto`。补充规则若写在它后面，等于没有进入有效匹配区间。需要压过后面更宽泛的规则时，再向列表顶部移动。

## 判断依据与失败时下一步

判断“还在不在”，看该行是否仍出现在 `rules` 中、类型名是否与手册一致、逻辑括号是否与示例同构、是否位于 `MATCH` 之上，以及目标 IP 类是否按需要带 `no-resolve`。手册同时指出：若更早的匹配已经触发 DNS 解析，则依旧会匹配到添加了 `no-resolve` 的目标 IP 类规则。

失败时下一步：先对照示例检查逗号与括号，排除整行无法按逻辑规则解析。若文本还在却从不命中，检查上方是否已有更宽规则截获，或 `MATCH` 位置过早。若请求为 UDP、而出站没有 UDP 支持，手册写明会继续向下匹配，应继续核对后续条目，而不是重复粘贴同一行。`DOMAIN-WILDCARD`、进程通配仅支持 `*` 和 `?`，且与配置文件其他地方的 Clash 格式通配符不相同；通配写错时，等于没有记下可命中的条件。不要添加该文档未出现的键名。

资料来源：https://wiki.metacubex.one/config/rules/
