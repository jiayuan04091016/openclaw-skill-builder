# Provider 合同说明

## 1. 账号登录 Provider

基础地址：

- `NEXT_PUBLIC_AUTH_PROVIDER_URL`

### `GET /profile`

返回：

```json
{
  "mode": "authenticated",
  "displayName": "测试用户",
  "email": "user@example.com"
}
```

### `POST /sign-in`

返回：

```json
{
  "ok": true,
  "message": "登录成功"
}
```

### `POST /sign-out`

返回：

```json
{
  "ok": true,
  "message": "登出成功"
}
```

## 2. 云端存储 Provider

基础地址：

- `NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL`

### `GET /projects`

返回：

```json
[
  {
    "id": "proj_xxx",
    "mode": "create",
    "title": "会议纪要助手",
    "goal": "整理会议纪要",
    "description": "",
    "audience": "",
    "mainTask": "",
    "inputFormat": "",
    "outputFormat": "",
    "outputStyle": "simple",
    "language": "中文",
    "warnings": "",
    "includeExamples": true,
    "resources": [],
    "importedSkillText": "",
    "importedSkillArchive": null,
    "draft": null,
    "createdAt": "2026-03-22T00:00:00.000Z",
    "updatedAt": "2026-03-22T00:00:00.000Z"
  }
]
```

### `POST /bundle`

请求体：
- `CloudSyncBundle`

返回：

```json
{
  "ok": true,
  "message": "已接收同步包",
  "projectCount": 1
}
```

## 3. OCR Provider

基础地址：

- `NEXT_PUBLIC_OCR_PROVIDER_URL`

### `POST /extract`

请求体：
- 单条 `ResourceItem`

返回：

```json
{
  "status": "completed",
  "text": "识别出的文字内容",
  "message": "OCR 完成"
}
```

## 4. 视频增强 Provider

基础地址：

- `NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL`

### `POST /summarize`

请求体：
- 单条 `ResourceItem`

返回：

```json
{
  "status": "completed",
  "summary": "视频摘要内容",
  "message": "视频增强完成"
}
```
