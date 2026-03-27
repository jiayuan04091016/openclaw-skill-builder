# V2 Acceptance Quickstart

## 1) 生成阶段快照

POST `/api/internal/stage-snapshot`
GET `/api/internal/v2-acceptance`
GET `/api/internal/v2-acceptance?format=markdown`
GET `/api/internal/v2-infra-status`
GET `/api/internal/v2-infra-status?format=markdown`
GET `/api/internal/release-readiness`
GET `/api/internal/release-readiness?format=markdown`
GET `/api/internal/stage-report`
GET `/api/internal/stage-report?format=markdown`
GET `/api/internal/stage-delivery-status`
GET `/api/internal/stage-delivery-status?format=markdown`
GET `/api/internal/stage-artifacts`
GET `/api/internal/stage-artifacts?format=markdown`
GET `/api/internal/stage-gates`
GET `/api/internal/stage-gates?format=markdown`
GET `/api/internal/stage-run-history`
GET `/api/internal/stage-run-history?format=markdown`
GET `/api/internal/real-integration-readiness`
GET `/api/internal/real-integration-readiness?format=markdown`
GET `/api/internal/provider-request-telemetry`
GET `/api/internal/provider-request-telemetry?format=markdown`

预期：
- 返回 `readyForUnifiedTesting`
- 返回 `readyForRealIntegration`
- `v2-acceptance` 返回 `scorePercent`、`passedCount/totalCount`、`nextStep`
- `release-readiness` 会包含 `providerTelemetry` 维度（成功率门槛默认 `95%`）
- `stage-gates` 会包含独立的 `provider-telemetry` 门禁（进入真实远端联调后，要求有样本且成功率达标）
- `stage-report` 会汇总 `gates` 通过率和当前阻塞门禁
- `files` 包含：
  - `v2-capability-readiness.md`
  - `provider-integration-plan.md`
  - `provider-gateway-readiness.md`
  - `provider-request-telemetry.md`
  - `sync-readiness.md`
  - `sync-pipeline-snapshot.md`
  - `media-provider-contract.md`
  - `import-readiness.md`
  - `import-provider-contract.md`
  - `real-integration-readiness.md`
  - `v2-infra-status.md`
  - `release-readiness.md`
  - `stage-report.md`
  - `stage-snapshot-manifest.md`
  - `stage-delivery-status.md`
  - `stage-artifacts.md`
  - `stage-gates.md`
  - `stage-full-last-run.json`
  - `stage-full-last-run.md`
  - `stage-full-run-history.jsonl`
  - `stage-run-history.md`
  - `stage-delivery-bundle-latest.txt`

可选：命令行一键验收
先保证本地服务已启动（默认 `http://127.0.0.1:3000`）。
`stage:full` 会在流程末尾强校验交付资产完整性（delivery + artifacts）。

```bash
npm run check:v2
npm run check:v2:md
npm run snapshot:stage
npm run snapshot:bundle
npm run snapshot:prune
npm run snapshot:history:rebuild
npm run stage:full
npm run stage:local
```

可选环境变量（`stage:local`）：
- `STAGE_LOCAL_HOST`（默认 `127.0.0.1`）
- `STAGE_LOCAL_PORT`（默认 `3000`）
- `STAGE_LOCAL_BOOT_TIMEOUT_SECONDS`（默认 `50`）

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

## 7) 检查旧 Skill 导入能力

GET `/api/internal/import-provider-contract`  
GET `/api/internal/import-provider-contract?format=markdown`  
GET `/api/internal/import-readiness`  
GET `/api/internal/import-readiness?format=markdown`

预期：
- `allValid: true`
- `readyForIntegration: true`
- `formatCoverage` 包含 `markdown`、`json`、`yaml`、`zip`
