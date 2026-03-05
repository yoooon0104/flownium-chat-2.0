param(
  [string]$ApiBaseUrl = "http://localhost:3010",
  [string]$AccessToken = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=== MVP2-A 배포 전 빠른 검증 ===" -ForegroundColor Cyan
Write-Host "API Base URL: $ApiBaseUrl"

# 1) 서버 헬스체크 검증
Write-Host "`n[1/3] /api/health 확인"
$health = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/health"
if (-not $health.ok) {
  throw "health check failed"
}
Write-Host "[PASS] health.ok = true" -ForegroundColor Green

# 2) 인증 없이 보호 API 접근 시 표준 에러 형식 검증
Write-Host "`n[2/3] 인증 없는 /api/chatrooms 에러 형식 확인"
try {
  Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/chatrooms" | Out-Null
  throw "expected unauthorized error"
} catch {
  $raw = $_.ErrorDetails.Message
  if (-not $raw) { throw }
  $errObj = $raw | ConvertFrom-Json
  if (-not $errObj.error.code) {
    throw "error.code is missing"
  }
  Write-Host "[PASS] error.code = $($errObj.error.code)" -ForegroundColor Green
}

# 3) 토큰을 넣은 경우 /auth/me 확인 (옵션)
Write-Host "`n[3/3] /auth/me 확인 (토큰 옵션)"
if ([string]::IsNullOrWhiteSpace($AccessToken)) {
  Write-Host "[SKIP] -AccessToken 미입력으로 건너뜀"
} else {
  $headers = @{ Authorization = "Bearer $AccessToken" }
  $me = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/auth/me" -Headers $headers
  if (-not $me.user.id) {
    throw "/auth/me user.id missing"
  }
  Write-Host "[PASS] user.id = $($me.user.id)" -ForegroundColor Green
}

Write-Host "`n=== 완료: 빠른 검증 통과 ===" -ForegroundColor Cyan
