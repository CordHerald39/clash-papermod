---
{
  "title": "Clash 更换控制接口端口后需要更新哪些连接",
  "description": "Clash 更换控制接口端口后需要更新哪些连接。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T20:33:43.488419+00:00",
  "lastmod": "2026-10-04T20:33:43.488419+00:00",
  "type": "post"
}
---

控制接口指全局配置中的外部控制器，即 RESTful API 监听，不是混合代理端口。把 external-controller 的端口从示例 9090 改成其他值后，所有把该端口写死的连接都要同步修改，否则内核已在新端口监听，旧连接仍打到空端口。

## 适用条件

适用于通过 TCP 或 TLS 访问 API 的面板、脚本、外部用户界面，以及在 API 端口上开启的 DOH。若部署只使用 external-controller-unix 或 external-controller-pipe，且从未依赖 TCP 端口，则更换 TCP 端口不会改变那两类连接。更改前应记下旧的 external-controller、external-controller-tls、secret、external-ui 与 external-controller-cors。

运行模式、日志级别、IPv6 开关不会因为 API 端口变化而改变，它们不能当作已经更新了控制接口连接的依据。

## 需要更新的连接与判断依据

1. 所有访问 RESTful API 的客户端。external-controller 的格式是主机加端口，端口变化后，客户端目标端口必须等于新值。
2. 外部用户界面。文档说明可以把静态网页资源运行在 Clash API，路径为 API 地址/ui。浏览器打开界面所用的端口跟随 external-controller，不存在单独的界面端口。只改内核、不改面板或书签中的端口，会连到旧端口。
3. HTTPS API。external-controller-tls 是独立监听，示例为 127.0.0.1:9443。更换明文 API 端口不会自动改 TLS 端口；面板若走 HTTPS，应更新这一项。使用 TLS 必须同时填写 external-controller，客户端看到的主机与端口要分别与这两项核对。证书和私钥在 tls 段配置，不随端口数字自动迁移。
4. 开在 RESTful API 端口上的 DOH。external-doh-server 在该端口提供路径（文档示例为 /dns-query），且该 URL 不会验证 secret。DOH 客户端中的端口必须改成新的 API 端口，路径仍应等于配置值。
5. CORS。若 allow-origins 写了带端口的来源，来源或 API 端口变化后浏览器可能拦截，需要让允许的源与实际打开界面的源一致。
6. 以下连接不必当作 API 端口去改：Unix socket 与 namedpipe 不是 TCP 端口；allow-lan、bind-address、lan-allowed-ips 作用于代理端口；authentication 作用于 http(s)/socks/mixed 的用户验证。改这些不能修复面板仍指向旧 API 端口的问题。

判断依据：每一类客户端实际连接的端口，等于它应该使用的那一条监听（明文 API 或 TLS API）的新端口。

## 失败时下一步

更换后旧端口无服务、新端口没有客户端，属于只改了一半。先用新的 external-controller 核对面板填写值，再确认 secret 仍匹配。若监听仍是 127.0.0.1，其他设备应改主机或改监听范围，而不是继续换端口。TLS 握手失败时检查 external-controller-tls 与 tls 证书。Unix socket 仍可用只说明本地套接字未改，不能证明 TCP 一侧的面板已更新。上述一致后再查 CORS 与 DOH 客户端。控制页面若仍打开旧地址上的残留界面，以配置里的新端口为准。

资料：https://wiki.metacubex.one/config/general/
