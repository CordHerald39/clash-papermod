---
{
  "title": "Clash 手机版：安装与权限备忘",
  "description": "Android客户端选择、配置步骤和VPN冲突的检查入口。",
  "date": "2026-09-30T10:00:00+08:00",
  "lastmod": "2026-09-30T10:00:00+08:00",
  "type": "page"
}
---

手机使用先从系统与安装包开始。Android选择APK，iPhone采用对应平台的应用分发方式，不能通用同一个安装文件。

## 安卓包从哪里取

[CMFA发行列表](https://github.com/MetaCubeX/ClashMetaForAndroid/releases)与[FlClash发行列表](https://github.com/chen08209/FlClash/releases)提供各自附件。核对手机支持的ABI，32位系统与64位系统可能需要不同包。

## 第一次授权的两处位置

打开APK时系统可要求允许浏览器安装应用。运行客户端时还会出现VPN请求，这项授权关系到流量接管。两者应分别理解，安装结束后可以收回浏览器安装权限。

CMFA导入并激活配置后启动服务，再选模式和节点。[VPN图标与连接检查]({{< relref "blog/android" >}})解释如何继续验证。

## 已经装好却访问失败

在同一网络里只运行一个VPN类应用做对照，查看配置是否激活以及请求日志。系统限制参考[Android VPN说明](https://developer.android.com/develop/connectivity/vpn)。下载或解析报错则转到[订阅文章]({{< relref "blog/subscription" >}})。
