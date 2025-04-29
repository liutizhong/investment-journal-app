# 如何在本地运行投资日志应用

这个指南将一步步教您如何在本地电脑上设置和运行投资日志应用。即使您没有编程经验，按照以下步骤也能成功运行应用。

## 前提条件

在开始之前，您需要安装以下软件：

1. **Node.js** - JavaScript运行环境（版本 14.0.0 或更高）
2. **npm** - Node.js包管理器（通常随Node.js一起安装）

## 步骤 1: 安装 Node.js 和 npm

访问 [Node.js 官网](https://nodejs.org/)，下载并安装适合您操作系统的最新 LTS（长期支持）版本。

安装完成后，打开命令行（终端）验证安装：

```bash
node -v
npm -v
```

如果显示版本号，说明安装成功。

## 步骤 2: 创建 React 应用

1. 打开命令行（终端），导航到您想要创建项目的目录，执行以下命令创建新的 React 应用：

```bash
npx create-react-app investment-journal
```

2. 等待项目创建完成后，进入项目目录：

```bash
cd investment-journal
```

## 步骤 3: 安装所需依赖

在项目目录中，执行以下命令安装必要的依赖：

```bash
npm install lucide-react
```

## 步骤 4: 替换项目文件

1. 打开项目文件夹，找到 `src` 目录。
2. 删除 `src` 目录中的所有文件。
3. 在 `src` 目录中创建以下文件：

### `src/index.js`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```


### `src/App.js`

将我为您创建的投资日志应用代码复制到此文件。这是整个应用的核心代码，包含了所有功能。


## 步骤 6: 启动应用

现在您可以启动应用了：

```bash
npm start
```

应用将在开发服务器上运行，浏览器会自动打开并访问 `http://localhost:3000`。您将看到投资日志应用的界面。

## 步骤 7: