# Syntero - Zotero 设置同步插件

一个用于在多个设备间同步 Zotero 设置和偏好的插件，使用 Zotero 内置的云同步功能。

## 功能特性

- **手动上传**：将当前 Zotero 设置上传到云端，并显示详细设置预览
- **手动同步**：从云端下载并应用设置（覆盖当前设置），显示变更对比
- **云存储**：使用 Zotero 现有的云同步基础设施
- **设备管理**：通过设备 ID 跟踪设置
- **快速访问**：工具栏按钮和菜单项，方便快速访问
- **美观界面**：浅蓝色风格按钮，带悬停效果

## 安装

1. 从 [Releases](https://github.com/EEExphon/Syntero-Plugin/releases) 页面下载最新的 `syntero-1.1.0.xpi` 文件
2. 打开 Zotero
3. 进入 **工具 → 插件**
4. 将 `.xpi` 文件拖拽到插件窗口
5. 如提示，重启 Zotero

## 使用方法

### 快速同步对话框

点击 Zotero 工具栏中的 **Syntero** 按钮打开同步对话框：

- **Sync**：从云端下载并应用设置（覆盖当前设置）
  - 同步后显示所有更改设置的详细列表，包括旧值和新值
- **上传**：将当前设置上传到云端
  - 上传后显示所有已上传设置的列表
- **Cancel**：关闭对话框，不执行任何操作

### 设置预览

- **上传后**：显示所有已上传到云端的设置
- **同步后**：显示所有已更改的设置，包括：
  - 设置键名
  - 旧值（同步前）
  - 新值（同步后）

### 错误处理

如果在点击 Sync 时在库中找不到配置文件，会显示英文错误消息："No valid configuration file found in the library. Please upload settings first using the 'Upload' button."

## 工作原理

1. **存储**：设置以 JSON 文件形式存储，作为特殊文档项附加到 Zotero 库中
2. **同步**：使用 Zotero 现有的云同步功能在设备间同步设置文件
3. **应用**：点击 "Sync" 时，插件下载设置文件并将所有偏好应用到当前 Zotero 安装
4. **变更跟踪**：插件跟踪实际更改的设置，仅显示有意义的差异

## 系统要求

- Zotero 7.0 或更高版本
- 已启用云同步的 Zotero 账户

## 构建

从源码构建插件：

```bash
cd syntero-plugin
./build.sh
```

这将创建一个 `syntero-1.1.0.xpi` 文件，可在 Zotero 中安装。

## 项目结构

```
syntero-plugin/
├── manifest.json              # 插件清单文件
├── bootstrap.js               # 插件入口点
├── build.sh                   # 构建脚本
├── updates.json               # 更新清单
└── content/
    ├── include.js             # 命名空间初始化
    ├── syntero-core.js        # 核心插件逻辑
    ├── syntero-preferences.js # 偏好管理
    ├── syntero-storage.js     # 云存储处理
    ├── syntero-sync.js        # 同步逻辑
    ├── syntero-ui.js          # UI 组件
    ├── syntero-dialog.xul     # 主同步对话框（未使用，使用 alert 风格）
    ├── syntero-changes-dialog.xul # 变更显示对话框（未使用，使用 alert 风格）
    └── icons/                 # 插件图标
        ├── syntero-icon-16.png
        ├── syntero-icon-24.png
        ├── syntero-icon-32.png
        └── syntero-icon-48.png
```

## 版本历史

### 版本 1.1.0（当前）

**新功能：**
- 添加自定义图标支持（16x16、24x24、32x32、48x48 像素）
- 美观的浅蓝色风格工具栏按钮，带悬停效果
- 文本对齐：工具栏按钮中的文本居中
- 增强错误处理：找不到配置文件时显示英文错误消息

**UI 改进：**
- 上传后设置预览：显示所有已上传的设置
- 同步后变更对比：显示更改设置的详细列表，包括旧值/新值
- 改进按钮样式，提供更好的视觉反馈

**移除功能：**
- 移除自动下载功能（所有同步操作现在都是手动的）
- 移除自动上传触发器（上传始终是手动的）

**技术变更：**
- 改进 deserialize 函数中的变更跟踪
- 增强 upload 函数，返回设置数据以供预览

### 版本 1.0.0

**初始发布：**
- 基本设置同步功能
- 手动上传和同步操作
- 使用 Zotero 同步基础设施的云存储
- 工具栏按钮和菜单集成
- 偏好面板注入

## 许可证

AGPL-3.0

## 作者

YU Shi Jiong

## 支持

如有问题或疑问，请访问：https://github.com/EEExphon/Syntero-Plugin
