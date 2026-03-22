# 真实服务接入最小清单

## 目标
在继续保持当前零成本本地可用的前提下，为后续真实服务接入准备最少的必要信息。

## 当前状态

已经完成：
- 真实账号登录 provider 接入位
- 真实云端存储 provider 接入位
- 真实 OCR provider 接入位
- 真实视频增强 provider 接入位

当前默认行为：
- 未配置远端地址时，全部自动回退到本地占位 provider

## 后续真正需要提供的最小信息

### 1. 账号登录
需要：
- 一个认证服务地址

环境变量：
- `NEXT_PUBLIC_AUTH_PROVIDER_URL`

远端最小接口：
- `GET /profile`
- `POST /sign-in`
- `POST /sign-out`

### 2. 云端存储
需要：
- 一个云端项目存储服务地址

环境变量：
- `NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL`

远端最小接口：
- `GET /projects`
- `POST /bundle`

### 3. OCR
需要：
- 一个 OCR 服务地址

环境变量：
- `NEXT_PUBLIC_OCR_PROVIDER_URL`

远端最小接口：
- `POST /extract`

### 4. 视频增强
需要：
- 一个视频增强或摘要服务地址

环境变量：
- `NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL`

远端最小接口：
- `POST /summarize`

## 建议接入顺序

1. 账号登录
2. 云端存储
3. OCR
4. 视频增强

## 什么时候需要找你

只有在下面这些情况，我才需要你给信息或做决定：

1. 要正式接某个真实服务
2. 需要你提供服务地址、密钥或账号
3. 需要你确认是否接受付费服务
