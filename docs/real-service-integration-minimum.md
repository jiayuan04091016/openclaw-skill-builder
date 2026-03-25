# 真实服务接入最小清单

## 目标
在继续保持当前零成本、本地可用的前提下，为后续真实服务接入准备最少但必要的信息。

## 当前状态
已经完成：
- 真实账号登录 provider 接入位
- 真实云端存储 provider 接入位
- 项目跨设备同步接入位
- 真实 OCR provider 接入位
- 真实视频增强 provider 接入位
- provider 健康检查与 readiness 报告

当前默认行为：
- 未配置远端地址时，全部自动回退到本地占位 provider
- 所有 provider 请求默认启用自动重试（3 次、250ms 起步指数退避）

## 可选：请求重试调优

如果你的真实服务网络较稳定、希望降低等待时间，或网络抖动较明显、希望更稳，可以调这些变量：

- `PROVIDER_REQUEST_RETRY_ATTEMPTS`
- `PROVIDER_REQUEST_RETRY_INITIAL_DELAY_MS`
- `PROVIDER_REQUEST_RETRY_BACKOFF_FACTOR`
- `NEXT_PUBLIC_PROVIDER_REQUEST_RETRY_ATTEMPTS`
- `NEXT_PUBLIC_PROVIDER_REQUEST_RETRY_INITIAL_DELAY_MS`
- `NEXT_PUBLIC_PROVIDER_REQUEST_RETRY_BACKOFF_FACTOR`

## 后续真正需要提供的最小信息

## 最快的真实配置方式

### 方式 1：先生成模板
在项目根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-real-env-template.ps1
```

执行后会自动生成：
- `.env.local`

然后只需要把真实地址填进去即可。

### 1. 账号登录
需要：
- 一个认证服务地址
- 一个健康检查路径，默认 `/health`

环境变量：
- `NEXT_PUBLIC_AUTH_PROVIDER_URL`
- `NEXT_PUBLIC_AUTH_PROVIDER_HEALTH_PATH`

最小接口：
- `GET /health`
- `GET /profile`
- `POST /sign-in`
- `POST /sign-out`

### 2. 云端存储
需要：
- 一个云端项目存储服务地址
- 一个健康检查路径，默认 `/health`

环境变量：
- `NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL`
- `NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_HEALTH_PATH`

最小接口：
- `GET /health`
- `GET /projects`
- `POST /bundle`

### 3. 项目跨设备同步
需要：
- 不单独新增 provider
- 直接复用云端存储 provider

依赖：
- `cloud-storage` 已可达
- `GET /projects` 可返回项目列表
- `POST /bundle` 可接收同步包

### 4. OCR
需要：
- 一个 OCR 服务地址
- 一个健康检查路径，默认 `/health`

环境变量：
- `NEXT_PUBLIC_OCR_PROVIDER_URL`
- `NEXT_PUBLIC_OCR_PROVIDER_HEALTH_PATH`

最小接口：
- `GET /health`
- `POST /extract`

### 5. 视频增强
需要：
- 一个视频增强或摘要服务地址
- 一个健康检查路径，默认 `/health`

环境变量：
- `NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL`
- `NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH`

最小接口：
- `GET /health`
- `POST /summarize`

## 建议接入顺序
1. 账号登录
2. 云端存储
3. 项目跨设备同步
4. OCR
5. 视频增强

## 什么情况下需要你来决定
只有下面这些情况我才需要你提供信息或做决定：
1. 要正式接某个真实服务
2. 需要你提供服务地址、密钥或账号
3. 需要你确认是否接受付费服务
