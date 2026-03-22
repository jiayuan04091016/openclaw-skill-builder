# 本地 Mock Provider 启用说明

## 目标
在不接真实第三方服务、不产生费用的前提下，先把“真实 provider 路径”在本地跑通。

## 已提供的本地 Mock Provider

- `/api/mock-providers/auth/profile`
- `/api/mock-providers/auth/sign-in`
- `/api/mock-providers/auth/sign-out`
- `/api/mock-providers/cloud/projects`
- `/api/mock-providers/cloud/bundle`
- `/api/mock-providers/ocr/extract`
- `/api/mock-providers/video/summarize`

## 本地配置方式

在项目根目录创建 `.env.local`，填入：

```env
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_CLOUD_SYNC=true
NEXT_PUBLIC_ENABLE_ENHANCED_IMPORT=true
NEXT_PUBLIC_PROVIDER_HEALTH_TIMEOUT_MS=5000

NEXT_PUBLIC_AUTH_PROVIDER_URL=http://127.0.0.1:3000/api/mock-providers/auth
NEXT_PUBLIC_AUTH_PROVIDER_HEALTH_PATH=/profile

NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL=http://127.0.0.1:3000/api/mock-providers/cloud
NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_HEALTH_PATH=/projects

NEXT_PUBLIC_OCR_PROVIDER_URL=http://127.0.0.1:3000/api/mock-providers/ocr
NEXT_PUBLIC_OCR_PROVIDER_HEALTH_PATH=/extract

NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL=http://127.0.0.1:3000/api/mock-providers/video
NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH=/summarize
```

## 启动后可验证的内容
1. 登录 provider 路径是否走通
2. 云端存储 provider 路径是否走通
3. OCR provider 路径是否走通
4. 视频增强 provider 路径是否走通
5. `provider-readiness` 是否返回已配置状态

## 说明
- 不配置这些地址时，系统仍然回退到本地占位 provider
- 配置成本地地址后，可以先验证“真实 provider 调用链”
- 真正接入外部服务时，只需要把地址替换掉，不需要再改业务层
