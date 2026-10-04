---
{
  "title": "Clash 电脑端：怎样记录上次稳定使用的客户端版本",
  "description": "Clash 电脑端：怎样记录上次稳定使用的客户端版本。了解适用条件、操作步骤与常见问题的排查方法。",
  "date": "2026-10-04T18:34:48.383913+00:00",
  "lastmod": "2026-10-04T18:34:48.383913+00:00",
  "type": "post"
}
---

电脑端使用 Clash Verge Rev 时，官方仓库并未把“自动记住上次稳定客户端版本”写成独立功能。要留下可回退的记录，只能依据发布页上的发行通道、tag 与安装包文件名，在确认某一正式版可日常使用时当场抄录，而不能事后用“当时的最新版”代替。

## 适用条件

本做法只适用于从 Clash Verge Rev 官方发布页取得的安装包。仓库对发行版的划分是：Stable 为正式版，高可靠性，适合日常使用；AutoBuild 为滚动更新版，适合测试反馈，可能存在缺陷；Alpha 已废弃。因此“上次稳定”应对准 Stable 上的具体 tag，而不是 AutoBuild 或 Alpha。系统范围包括 Windows（x64 与 ARM64，发布说明写明不再支持 Win7）、macOS 11 及以上（Intel 与 Apple 芯片）以及 Linux。Windows 另有内置 Webview2 的安装包，资料写明体积较大，仅在企业版系统或无法安装 Webview2 时使用。Linux 需分清 DEB 与 RPM，以及 amd64、ARM64、ARMv7。只有操作系统、CPU 架构、包类型与文件名一致，这条记录才有回退意义。

## 具体操作与判断依据

确认某一版本可日常使用后，打开官方 Release 页面，按下述字段逐项记录，并与资源列表核对。第一项是 tag_name，例如 v2.5.7、v2.5.6、v2.5.5，这是检索主键。第二项是完整资源文件名，不要缩写：Windows 常用 64 位为 Clash.Verge_版本号_x64-setup.exe，ARM64 为 Clash.Verge_版本号_arm64-setup.exe；内置 Webview2 的文件名含 fixed_webview2-setup.exe。macOS 为 Clash.Verge_版本号_aarch64.dmg 或 Clash.Verge_版本号_x64.dmg。Linux DEB、RPM 的文件名同样含版本与架构。判断是否记对看三点：tag 与文件名中的版本号相同；架构和扩展名与本机一致；通道是正式版而非 AutoBuild 或已废弃的 Alpha。发布说明中的创建时间可一并记下，便于排序。不要用“最新”代替 tag。同时保留当时下载的安装包，文件名已含版本，便于离线核对。

## 失败时的下一步

若换用更新 tag 后无法按原方式使用，先取出已记录的 tag_name 与完整文件名，确认那是升级前的包。再到同一发布页按 tag 向下查找相邻正式版，例如从 v2.5.7 定位到 v2.5.6 或 v2.5.5，只下载与记录中架构、包类型相同的资源，不要混用 x64 与 ARM64，也不要把普通安装包与 fixed_webview2 包当成同一条记录。Windows 若为 Win7，这些发行包已写明不再支持，回退同一发布页也无法得到该系统的包。本地文件丢失时，用已写下的 tag 重新定位同名资源。若 tag、文件名、架构对不上，回到仓库中的 Stable 发布入口，按系统重新选包，把新的 tag 与文件名写成完整记录后再作为基线。服务无法启动或内核相关提示，应对照该 tag 的修复说明与系统差异，而不是改记未经核对的其他文件。

https://github.com/clash-verge-rev/clash-verge-rev/releases
https://github.com/clash-verge-rev/clash-verge-rev
