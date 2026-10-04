---
{
  "title": "Clash 怎样把过宽关键词规则改成明确域名项",
  "description": "Clash 怎样把过宽关键词规则改成明确域名项。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.500388+00:00",
  "lastmod": "2026-10-04T20:33:43.500388+00:00",
  "type": "post"
}
---

Clash 配置里，DOMAIN-KEYWORD 表示域名关键字匹配：请求域名只要包含该关键字就会命中对应出站。关键字过短或过于常见时，命中集合会明显大于某一个完整主机，或某一注册域及其子域。要把过宽关键词规则改成明确域名项，应改用官方给出的 DOMAIN、DOMAIN-SUFFIX；确有模式或分类需求时，再改用 DOMAIN-WILDCARD、DOMAIN-REGEX 或 GEOSITE。规则按从上到下的顺序匹配，列表顶部优先级更高，替换类型后必须同时调整条目位置。

## 适用条件与判断依据

适用改写的条件是：目标已经可以写成完整域名或明确后缀，而不再依赖包含某子串。判断是否过宽，以官方类型定义为准。DOMAIN 匹配完整域名。DOMAIN-SUFFIX 匹配域名后缀：google.com 会匹配 www.google.com、mail.google.com 和 google.com，但不匹配 content-google.com。DOMAIN-KEYWORD 没有这种边界，关键字 google 既可能命中 google.com，也可能命中把该子串嵌在其它标签里的名字。

下列情形应改写。第一，关键字短于完整主机名或注册域，无法唯一对应目标。第二，你实际需要的是后缀关系，但当前规则会命中官方在 DOMAIN-SUFFIX 中明确排除的中间插入字符形式。第三，关键词写在更精确的 DOMAIN 或 DOMAIN-SUFFIX 之前，会因优先级提前截获。官方还说明，若请求为 udp，而代理节点没有 udp 支持（例如 ss 节点没写 udp: true），则会继续向下匹配。过宽关键字会改变后面规则有没有机会生效，因此不能只看某一协议是否正常。

若名单无法枚举、必须用模式表达，则不要继续使用关键字，应改 DOMAIN-WILDCARD 或 DOMAIN-REGEX。通配仅支持 * 和 ?，* 匹配零个或多个字符，? 匹配一个字符，并且这里的通配符和配置文件其他地方的 Clash 格式通配符不相同。若域名属于 Geosite 分类，可用 GEOSITE 代替极宽关键字。

## 对照类型改写的步骤

在 rules 列表中只替换匹配器与载荷，出站策略名称保持原意。

第一步，找出 DOMAIN-KEYWORD 行。官方示例为 DOMAIN-KEYWORD,google,auto。记下关键字、出站以及该行在列表中的位置。

第二步，单一完整主机改为 DOMAIN。官方示例 DOMAIN,ad.com,REJECT 只匹配该完整域名，适合固定接口或单一拦截对象。

第三步，注册域及其子域改为 DOMAIN-SUFFIX。官方示例 DOMAIN-SUFFIX,google.com,auto。改写是否正确，看是否符合后缀关系：子域与自身命中，content-google.com 不命中。这是把过宽关键字收窄时最常用的对应关系。

第四步，必须通配时用 DOMAIN-WILDCARD，官方示例 DOMAIN-WILDCARD,*.google.com,auto，只使用 * 与 ?。更复杂模式用 DOMAIN-REGEX，官方示例 DOMAIN-REGEX,^abc.*com,PROXY。分类域名可用 GEOSITE,youtube,PROXY。引用规则集合用 RULE-SET,providername,proxy，需配置 rule-providers。

第五步，需要同时约束网络类型等条件时使用逻辑规则，并注意括号。官方示例包括 AND,((DOMAIN,baidu.com),(NETWORK,UDP)),DIRECT 以及 NOT,((DOMAIN,baidu.com)),PROXY。把 DOMAIN 放在较宽的 DOMAIN-SUFFIX 之上，删除或下移原来的 DOMAIN-KEYWORD，避免包含匹配仍然抢先。列表末尾用 MATCH 匹配所有剩余请求。

域名类改写通常不必加 no-resolve。该附加参数仅支持关于目标 IP 的规则；域名开始匹配目标 IP 规则时会触发 dns 解析，可选择 no-resolve 跳过。不要把 IP-CIDR、GEOIP 当作域名关键字的替代写法。

## 失败时的核对与下一步

改写后若出站仍不符合预期，先核对优先级：规则将按照从上到下的顺序匹配，顶部高于底下。下一步是把明确域名项移到上方，并去掉仍保留的 DOMAIN-KEYWORD，防止关键字再次先命中。

若 DOMAIN-SUFFIX 没有命中预期主机，对照官方例子，google.com 作为后缀不匹配 content-google.com。下一步应补 DOMAIN 精确项，或在确有模式需求时改为 DOMAIN-WILDCARD、DOMAIN-REGEX，而不是加回关键字。通配必须按 * 与 ? 的含义书写，不能套用配置文件其他地方的 Clash 格式通配符，否则会过宽或完全不中。

逻辑规则无效时，检查是否按 LOGIC_TYPE,((payload1),(payload2)),Proxy 使用括号。需要进入另一组规则时使用 SUB-RULE，同样注意括号。若只有 udp 等部分流量异常，结合 NETWORK 与节点是否支持 udp：无支持会继续向下匹配，域名收窄不能代替这项检查。仍无法定位时，逐条对照 DOMAIN、DOMAIN-SUFFIX、DOMAIN-WILDCARD、DOMAIN-REGEX、GEOSITE 的定义，避免把 PROCESS-NAME、IP-CIDR 等非域名规则误当作关键字的替代。

参考资料：
https://wiki.metacubex.one/config/rules/
