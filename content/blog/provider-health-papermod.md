---
{
  "title": "Clash 更换健康检查目标后如何比较结果",
  "description": "Clash 更换健康检查目标后如何比较结果。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.487435+00:00",
  "lastmod": "2026-10-04T20:33:43.487435+00:00",
  "type": "post"
}
---

更换代理集合健康检查目标后，不能把新旧延迟数字直接并列当结论。文档把 health-check 定义为健康检查（延迟测试）。结果是否可比，取决于检查地址、期望状态、间隔、超时和懒惰状态是否处于同一套条件。

## 适用条件

本说明只覆盖 proxy-providers 中的 health-check。适用前提是 health-check.enable 为 true，并且已填写 health-check.url。文档推荐的目标为 Cloudflare 与 Google 两类地址：https://cp.cloudflare.com 与 https://www.gstatic.com/generate_204。未启用检查，或 http、file 解析失败后仅存在 payload 备用节点时，没有可比较的集合检查样本。

更换前先抄写五项：url、expected-status、interval（单位为秒）、timeout（单位为毫秒）、lazy。lazy 默认为 true，含义是不使用该集合节点时不进行测试。比较前必须确认两次取样时该集合都处于会被测试的状态，否则一侧空结果不能当成延迟变差。

## 比较步骤与判断依据

1. 只修改 health-check.url，其余四项暂时保持不变，避免多变量同时变化。
2. 按新目标的 HTTP 响应核验 expected-status。文档示例把 expected-status 写成 204，与 generate_204 一类固定状态页相对应。新目标若返回其他状态而期望值仍是旧的，通过与失败会混在一起，延迟不可比。
3. 两侧使用相同的 interval 与 timeout。间隔决定下一次测试何时发生，超时决定未完成的请求如何被记为失败。
4. 等待至少一个完整的 health-check.interval。在 lazy 为 true 时，若期间没有使用该集合，应视为尚未产生新样本。
5. 对照同一节点名称的结果类别：在超时时间内且状态符合 expected-status 记为通过，否则记为失败。只有两个 url 都是语义接近的探测页、且期望状态含义一致时，才把延迟数值放在一起看相对高低；否则只比较通过集合与失败集合有没有系统性变化。

判断依据：在 timeout、expected-status 语义、lazy 条件一致时，通过与失败的集合是否随目标改变而翻转。个别节点抖动不足以说明新目标本身不可用。

## 失败时下一步

大量失败或完全没有新数据时，一次只改一类项。先确认 enable 仍为 true。再核对 url 是否为上述推荐地址或你能明确说明响应状态的地址，并让 expected-status 与该响应一致。仍无数据则检查 lazy：可在确认集合被使用后再等一个间隔；若必须立即得到样本，可将 lazy 设为 false 以便产生检查，之后是否改回按是否需要在闲置时测试来决定。请求总是超时，先单独提高 timeout，观察是否变为有响应但状态不符；若状态不符，回到期望状态与目标页面的对应关系。

注意区分两套 interval：集合自身的 interval 是更新 provider 的秒数，health-check.interval 才是延迟测试周期。经 proxy 下载集合、size-limit 以及加密相关项影响的是节点列表是否刷新，不能用来解释探测目标更换后的检查结果。

资料：https://wiki.metacubex.one/config/proxy-providers/
