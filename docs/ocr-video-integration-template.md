# OCR & 视频增强接入模板

## 目标

最小成本把 OCR 与视频增强从本地 mock 切到真实服务，且不破坏现有第一版体验。

## 一键切换（环境变量）

在 `.env.local` 配置：

```env
# OCR
OCR_PROVIDER_URL=https://your-ocr-service.example.com
OCR_PROVIDER_HEALTH_PATH=/health
OCR_PROVIDER_AUTH_HEADER_NAME=Authorization
OCR_PROVIDER_AUTH_HEADER_VALUE=Bearer your-secret-token

# Video
VIDEO_ENHANCEMENT_PROVIDER_URL=https://your-video-service.example.com
VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH=/health
VIDEO_ENHANCEMENT_PROVIDER_AUTH_HEADER_NAME=Authorization
VIDEO_ENHANCEMENT_PROVIDER_AUTH_HEADER_VALUE=Bearer your-secret-token
```

说明：
- 优先使用服务端私有变量 `OCR_PROVIDER_*` / `VIDEO_ENHANCEMENT_PROVIDER_*`
- 未配置时才会回退 `NEXT_PUBLIC_*`

## 远端接口契约（最小版）

### OCR

请求：`POST /extract`

```json
{
  "id": "resource-id",
  "type": "image",
  "name": "sample.png",
  "content": "image source content",
  "createdAt": "2026-03-25T00:00:00.000Z"
}
```

响应：

```json
{
  "status": "completed",
  "text": "识别后的文本",
  "message": "OCR success"
}
```

### 视频增强

请求：`POST /summarize`

```json
{
  "id": "resource-id",
  "type": "video",
  "name": "sample.mp4",
  "content": "video source content",
  "createdAt": "2026-03-25T00:00:00.000Z"
}
```

响应：

```json
{
  "status": "completed",
  "summary": "视频摘要结果",
  "message": "Video summarize success"
}
```

## 验收步骤

1. 启动应用后调用：`GET /api/internal/ocr-provider-contract`
2. 启动应用后调用：`GET /api/internal/video-provider-contract`
3. 查看：`GET /api/internal/ocr-readiness`
4. 查看：`GET /api/internal/video-readiness`

通过标准：
- `contract` 返回 `allValid: true`
- readiness 返回 `readyForIntegration: true`

## 常见问题

- `allValid=false`：返回结构字段不匹配（优先检查 `status`、`text/summary`、`message`）
- `reachable=false`：服务地址或健康检查路径不通
- `not-configured`：环境变量未生效（重启进程后再检查）

