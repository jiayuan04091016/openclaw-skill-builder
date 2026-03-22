# 第二版统一测试清单

## 目标
在不接 GPT 的前提下，先验证第二版 1 到 6 项主框架都已经具备可调用入口，并且不会破坏第一版现有流程。

## 第一部分：框架烟雾测试
先运行内部接口：

- `GET /api/internal/v2-smoke`
- `GET /api/internal/v2-smoke?format=markdown`

通过标准：

- 返回 `allPassed: true`
- 六项检查都为 `ok: true`
- Markdown 报告可正常输出中文

检查项：

1. 账号登录
2. 云端存储
3. 跨设备同步
4. 旧 Skill 解析
5. OCR
6. 视频增强

## 第二部分：主流程回归
确认第一版主流程未被第二版底座破坏。

检查项：

1. 从零创建项目
2. 导入旧 Skill
3. 生成草稿
4. 预览内容
5. 导出 ZIP
6. 本地备份导出与恢复

通过标准：

- 页面可正常打开
- 关键按钮无报错
- 导出仍可完成
- 本机项目不会丢失

## 第三部分：第二版能力人工检查
这部分检查“入口是否接好”，不要求现在就接真实第三方服务。

### 账号登录
- `auth-provider`
- `auth-service`
- `session-repository`
- `session-action-service`

检查点：
- 可获取当前会话资料
- `signIn / signOut` 可调用

### 云端存储与跨设备同步
- `cloud-storage-provider`
- `cloud-storage-service`
- `cloud-project-gateway`
- `cloud-sync-engine`

检查点：
- 可构建同步包
- 可模拟推送
- 可模拟拉取并合并

### 旧 Skill 解析
- `skill-import-loader`
- `skill-import-parser`
- `skill-import`
- `skill-import-pipeline-service`
- `project-import-pipeline-service`

检查点：
- 支持 `.md`
- 支持 `.txt`
- 支持 `.zip`
- 能输出字段
- 能生成导入归档

### OCR / 视频增强
- `ocr-provider`
- `ocr-service`
- `video-enhancement-provider`
- `video-enhancement-service`
- `media-processing-service`
- `project-media-processing-service`

检查点：
- 单资源处理可调用
- 项目级处理可调用
- 结果可回写到项目资源

## 第四部分：统一测试后的处理顺序

如果框架烟雾测试失败：
- 先修框架，不进入界面层测试

如果框架烟雾测试通过，但主流程回归失败：
- 先修第一版主流程回归问题

如果框架烟雾测试和主流程回归都通过：
- 再继续补真实服务接入
- 顺序保持不变：
  1. 账号登录
  2. 云端存储
  3. 跨设备同步
  4. 旧 Skill 解析增强
  5. OCR
  6. 视频增强
  7. 最后 GPT
