param(
  [string]$BaseUrl = "http://localhost:3010"
)

$ErrorActionPreference = "Stop"

function Write-Section($title) {
  Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

function Read-JwtSecret {
  $envPath = Join-Path $PSScriptRoot "..\server\.env"
  if (!(Test-Path $envPath)) {
    throw "server/.env 파일을 찾을 수 없습니다: $envPath"
  }

  $line = Get-Content $envPath | Where-Object { $_ -match '^JWT_SECRET=' } | Select-Object -First 1
  if (-not $line) {
    throw "JWT_SECRET 값을 server/.env에서 찾지 못했습니다."
  }

  return ($line -replace '^JWT_SECRET=', '').Trim()
}

function New-TestToken($secret) {
  Push-Location (Join-Path $PSScriptRoot "..\server")
  try {
    $token = node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({userId:'u-test-1',nickname:'tester1',tokenType:'access'}, '$secret', {expiresIn:'1h'}));"
    return $token.Trim()
  }
  finally {
    Pop-Location
  }
}

function Invoke-TestRequest {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Uri,
    [hashtable]$Headers,
    [string]$Body,
    [string]$ExpectedCode
  )

  Write-Section $Name
  try {
    $params = @{
      Method = $Method
      Uri = $Uri
    }
    if ($Headers) { $params.Headers = $Headers }
    if ($Body) {
      $params.ContentType = "application/json"
      $params.Body = $Body
    }

    $res = Invoke-RestMethod @params
    Write-Host "[WARN] 예상과 달리 성공 응답 수신" -ForegroundColor Yellow
    $res | ConvertTo-Json -Depth 8
  }
  catch {
    $raw = $_.ErrorDetails.Message
    if (-not $raw) {
      Write-Host "응답 본문을 읽지 못했습니다." -ForegroundColor Red
      throw
    }

    $json = $raw | ConvertFrom-Json
    $actualCode = $json.error.code
    $actualMsg = $json.error.message

    Write-Host "error.code    : $actualCode"
    Write-Host "error.message : $actualMsg"

    if ($ExpectedCode -and $actualCode -ne $ExpectedCode) {
      Write-Host "[FAIL] expected=$ExpectedCode, actual=$actualCode" -ForegroundColor Red
      throw "에러코드 불일치"
    }

    Write-Host "[PASS] expected=$ExpectedCode" -ForegroundColor Green
  }
}

Write-Section "준비"
$secret = Read-JwtSecret
$token = New-TestToken -secret $secret
Write-Host "테스트 토큰 생성 완료"

Invoke-TestRequest -Name "1) /auth/refresh 필수값 누락" -Method "Post" -Uri "$BaseUrl/auth/refresh" -Body "{}" -ExpectedCode "INVALID_REQUEST"
Invoke-TestRequest -Name "2) 인증 없이 /api/chatrooms" -Method "Get" -Uri "$BaseUrl/api/chatrooms" -ExpectedCode "UNAUTHORIZED"
Invoke-TestRequest -Name "3) 없는 room 메시지 조회" -Method "Get" -Uri "$BaseUrl/api/chatrooms/000000000000000000000000/messages" -Headers @{ Authorization = "Bearer $token" } -ExpectedCode "ROOM_NOT_FOUND"

Write-Section "완료"
Write-Host "모든 error.code 테스트를 통과했습니다." -ForegroundColor Green
