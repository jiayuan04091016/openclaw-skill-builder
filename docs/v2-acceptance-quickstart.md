# V2 Acceptance Quickstart

## 1) 生成阶段快照

POST `/api/internal/stage-snapshot`

预期：
- 返回 `readyForUnifiedTesting`
- 返回 `readyForRealIntegration`
- `files` 包含：
  - `v2-capability-readiness.md`
  - `provider-integration-plan.md`
  - `provider-gateway-readiness.md`
  - `sync-readiness.md`
  - `sync-pipeline-snapshot.md`
  - `media-provider-contract.md`

## 2) 检查同步闭环

GET `/api/internal/sync-readiness`  
GET `/api/internal/sync-readiness?format=markdown`

关注字段：
- `cloudGatewayReady`
- `authCloudBridgeReady`
- `syncSmokeReady`
- `syncRoundtripReady`
- `readyForIntegration`

## 3) 检查桥接链路

GET `/api/internal/auth-cloud-bridge-smoke`  
GET `/api/internal/sync-roundtrip-smoke`  
GET `/api/internal/auth-cloud-bridge-smoke?format=markdown`  
GET `/api/internal/sync-roundtrip-smoke?format=markdown`

预期：
- HTTP 200（通过）
- `ok: true`

## 4) 检查 mock 隔离

GET `/api/internal/mock-cloud-isolation-smoke`

预期：
- `isolated: true`
- `ok: true`

## 5) 生成同步闭环快照

POST `/api/internal/sync-pipeline-snapshot`

预期：
- 生成 `docs/sync-pipeline-snapshot.md`
- `readyForIntegration: true`（在 mock/真实链路满足时）

## 6) 检查 OCR/视频合约

GET `/api/internal/ocr-provider-contract`  
GET `/api/internal/video-provider-contract`  
GET `/api/internal/ocr-provider-contract?format=markdown`  
GET `/api/internal/video-provider-contract?format=markdown`
GET `/api/internal/media-provider-contract`  
GET `/api/internal/media-provider-contract?format=markdown`
POST `/api/internal/media-provider-contract-snapshot`

预期：
- HTTP 200（通过）
- `allValid: true`
