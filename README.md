# 猫眼电影 API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

一个基于 Cloudflare Workers 的高性能电影数据API，用于获取猫眼电影的详细信息，包括票房数据、评分、剧情简介等。

## 🎬 项目特色

- **🚀 高性能**: 基于 Cloudflare Workers 的全球分布式部署
- **⚡ 一键部署**: 支持 Cloudflare Workers 一键部署按钮
- **📊 丰富数据**: 提供票房、评分、剧情、演职人员等完整信息
- **💾 智能缓存**: 使用 Cloudflare KV 存储进行数据缓存，提升响应速度
- **🎨 现代界面**: 提供精美的交互式前端页面
- **🔒 稳定可靠**: 完善的错误处理和数据验证机制
- **📱 响应式设计**: 支持桌面端和移动端访问

## 📋 功能特性

### 核心功能
- 📝 获取电影基础信息（片名、导演、类型、上映日期等）
- 📊 实时票房数据获取
- ⭐ 多平台评分信息（猫眼、IMDB）
- 📖 详细剧情简介
- 🖼️ 高清电影海报
- 🎭 演职人员信息（受限）
- 🏆 奖项信息（受限）

### 技术特性
- 🌐 RESTful API 设计
- 🚀 Serverless 架构
- 📦 KV 存储缓存
- 🔄 自动数据更新
- 🛡️ CORS 支持
- 📱 移动端适配

## 🚀 快速开始

### 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Ahua9527/maoyan_movie_api_cf)

点击上方按钮即可一键部署到你的 Cloudflare Workers 账户。

### 在线使用

直接访问：[https://maoyan.ahua.space](https://maoyan.ahua.space)

### API 直接调用

```bash
# 获取电影信息
curl https://maoyan.ahua.space/api/movie/1294273

# 检查服务状态
curl https://maoyan.ahua.space/api/status
```

## 📖 API 文档

### 基础信息

- **基础URL**: `https://maoyan.ahua.space`
- **支持格式**: JSON
- **请求方式**: GET
- **响应编码**: UTF-8

### 端点说明

#### 1. 获取电影详细信息

```
GET /api/movie/{movieId}
```

**参数说明**:
- `movieId` (必需): 猫眼电影ID，例如 `1294273`

**响应示例**:
```json
{
  "movieId": "1294273",
  "basic": {
    "movieId": "1294273",
    "movieName": "哪吒之魔童闹海",
    "movieEnName": "NE ZHA 2",
    "movieImg": "https://p0.pipi.cn/mediaplus/friday_image_fe/0fa334520515c28b0793b67ea7fad03b546ff.jpg?imageMogr2/quality/80",
    "director": "饺子",
    "category": "喜剧,剧情,动画",
    "releaseDate": "2025-01-29",
    "boxOffice": "154.31亿",
    "duration": "144分钟",
    "region": "中国大陆"
  },
  "rating": {
    "MaoYanRating": "9.8",
    "IMDBRating": "8.1"
  },
  "plot": {
    "summary": "天劫之后，哪吒、敖丙的灵魂虽保住了，但肉身很快会魂飞魄散。太乙真人打算用七色宝莲给二人重塑肉身。但是在重塑肉身的过程中却遇到重重困难，哪吒、敖丙的命运将走向何方？"
  },
  "castCrew": {
    "actors": [],
    "note": "受数据源限制，演员详细信息暂不可用",
    "limitation": "已测试多个API接口，均返回404错误"
  },
  "awards": {
    "list": [],
    "note": "受数据源限制，奖项信息暂不可用",
    "limitation": "已测试多个API接口，均返回404错误"
  },
  "_meta": {
    "requestTime": "2025-06-06T00:25:21.865 UTC+8",
    "dataType": "complete",
    "version": "1.0.0",
    "fromCache": false,
    "processingTime": 1351,
    "dataSources": [
      "piaofang.maoyan.com",
      "api.maoyan.com"
    ],
    "success": true
  }
}
```

#### 2. 服务状态检查

```
GET /api/status
```

**响应示例**:
```json
{
  "status": "🚀 生产就绪",
  "version": "1.0.0",
  "timestamp": "2025-06-05T16:28:38.721Z",
  "endpoints": {
    "/api/movie/:id": "获取完整电影数据",
    "/api/status": "API服务状态"
  }
}
```

### 错误响应

当请求失败时，API 返回包含错误信息的 JSON：

```json
{
  "success": false,
  "error": "电影ID不存在或数据获取失败",
  "movieId": "invalid_id",
  "timestamp": "2025-06-06T12:00:00.000Z",
  "version": "1.0.0"
}
```

## 🛠️ 本地开发

### 部署方式选择

**方式一：一键部署（推荐新手）**

使用上方的部署按钮，无需本地环境配置，直接部署到 Cloudflare Workers。

**方式二：本地开发部署**

适合需要自定义修改的开发者。

### 环境要求

- Node.js 18.0.0+
- npm 或 yarn
- Cloudflare 账号
- Wrangler CLI

### 安装步骤

> **💡 提示**: 如果你使用了上方的一键部署按钮，可以跳过步骤1-2，直接从步骤4开始配置。

1. **克隆项目**
```bash
git clone https://github.com/Ahua9527/maoyan_movie_api_cf.git
cd maoyan_movie_api_cf
```

2. **安装依赖**
```bash
npm install
```

3. **配置 Wrangler**
```bash
# 登录 Cloudflare
npx wrangler login

# 创建 KV 命名空间
npx wrangler kv namespace create "MOVIE_CACHE"
```

4. **更新配置**

编辑 `wrangler.toml` 文件，替换 KV 命名空间 ID：

```toml
[[kv_namespaces]]
binding = "MOVIE_CACHE"
id = "your-kv-namespace-id"
```

5. **本地开发**
```bash
npm run dev
```

6. **部署到生产**
```bash
npm run deploy
```

## ⚙️ 配置说明

### 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
API_VERSION = "1.0.0"          # API版本号
CACHE_TTL_BASIC = "3600"       # 基础数据缓存时间（秒）
CACHE_TTL_FULL = "1800"        # 完整数据缓存时间（秒）
RATE_LIMIT_MAX = "100"         # 每分钟最大请求数
RATE_LIMIT_WINDOW = "60000"    # 速率限制窗口（毫秒）
```

### KV 存储配置

项目使用 Cloudflare KV 进行数据缓存：

- **命名空间**: `MOVIE_CACHE`
- **缓存策略**: 成功数据缓存30分钟，失败请求不缓存
- **键格式**: `movie:{movieId}:v{version}`

## 📊 性能优化

### 缓存策略

1. **数据缓存**: 电影数据缓存30分钟，减少源站请求
2. **智能更新**: 自动检测数据变化，及时更新缓存
3. **错误处理**: 失败请求不进入缓存，避免错误传播

### 请求优化

1. **并行请求**: 同时请求多个数据源，提升获取速度
2. **超时控制**: 设置合理的请求超时时间
3. **重试机制**: 自动重试失败的请求

## 🔧 故障排除

### 常见问题

1. **电影数据获取失败**
   - 检查电影ID是否正确
   - 确认网络连接正常
   - 查看源站是否可访问

2. **缓存问题**
   - 检查 KV 命名空间配置
   - 确认权限设置正确
   - 查看缓存过期时间

3. **部署问题**
   - 确认 Wrangler 配置正确
   - 检查 Cloudflare 账号权限
   - 查看部署日志信息

### 调试方法

```bash
# 查看实时日志
npm run logs

# 检查部署状态
npx wrangler tail
```
## 📈 监控和分析

### 性能指标

- 响应时间: 通常 < 2秒
- 缓存命中率: > 70%
- 错误率: < 5%
- 可用性: > 99.9%

### 监控工具

- Cloudflare Analytics
- Workers Analytics
- 自定义日志记录

## 🤝 贡献指南

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范

- 使用 ES6+ 语法
- 添加适当的注释
- 保持代码风格一致
- 编写测试用例

## 📄 许可证

本项目使用 [MIT 许可证](LICENSE)。

## 🔗 相关链接

- [项目主页](https://maoyan.ahua.space)
- [GitHub 仓库](https://github.com/Ahua9527/maoyan_movie_api_cf)
- [一键部署](https://deploy.workers.cloudflare.com/?url=https://github.com/Ahua9527/maoyan_movie_api_cf)
- [问题反馈](https://github.com/Ahua9527/maoyan_movie_api_cf/issues)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare 部署按钮说明](https://developers.cloudflare.com/workers/platform/deploy-buttons/)

## 📧 联系方式

- 作者:  哆啦Ahua🌱
- 邮箱: [通过 GitHub Issues 联系]
- 主页: https://maoyan.ahua.space

## 🙏 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/) - 强大的边缘计算平台
- [猫眼电影](https://www.maoyan.com/) - 数据来源
- [React](https://reactjs.org/) - 前端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

**⚠️ 免责声明**: 本项目仅供学习和研究使用，请遵守相关网站的使用条款和法律法规。数据版权归原网站所有。