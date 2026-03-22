# 真实服务接入计划快照

当前是否已可进入真实联调：还不可以
下一优先 provider：auth
下一步：先补 auth 的真实服务地址。

## 接入顺序
- auth：未配置
  说明：先接账号登录，后续云端项目才能稳定归属到用户。
  环境变量：NEXT_PUBLIC_AUTH_PROVIDER_URL、NEXT_PUBLIC_AUTH_PROVIDER_HEALTH_PATH
  最小接口：GET /health、GET /profile、POST /sign-in、POST /sign-out
- cloud-storage：未配置
  说明：接完账号后，优先接项目存储和跨设备同步。
  环境变量：NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL、NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_HEALTH_PATH
  最小接口：GET /health、GET /projects、POST /bundle
- ocr：未配置
  说明：OCR 会直接提升图片资料进入 Skill 生成链路的质量。
  环境变量：NEXT_PUBLIC_OCR_PROVIDER_URL、NEXT_PUBLIC_OCR_PROVIDER_HEALTH_PATH
  最小接口：GET /health、POST /extract
- video：未配置
  说明：视频增强放在最后接，避免一开始就引入高成本链路。
  环境变量：NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL、NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH
  最小接口：GET /health、POST /summarize