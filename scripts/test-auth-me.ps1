param(
  [string]$BaseUrl = "http://localhost:3010",
  [Parameter(Mandatory = $true)]
  [string]$AccessToken,
  [string]$ExpectedEmail = ""
)

$ErrorActionPreference = "Stop"

function Write-Section($title) {
  Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

Write-Section "1) /auth/me 호출"

try {
  $res = Invoke-RestMethod -Method Get -Uri "$BaseUrl/auth/me" -Headers @{ Authorization = "Bearer $AccessToken" }

  if (-not $res.user) {
    throw "응답에 user 객체가 없습니다."
  }

  $email = [string]$res.user.email
  $nickname = [string]$res.user.nickname
  $userId = [string]$res.user.id

  Write-Host "user.id       : $userId"
  Write-Host "user.nickname : $nickname"
  Write-Host "user.email    : $email"

  if ($null -eq $res.user.email) {
    throw "user.email 필드가 null 입니다. 빈 문자열 또는 이메일 문자열이어야 합니다."
  }

  if ($ExpectedEmail -and ($email.ToLower() -ne $ExpectedEmail.ToLower())) {
    throw "email 불일치: expected=$ExpectedEmail, actual=$email"
  }

  Write-Host "[PASS] /auth/me email 필드 검증 완료" -ForegroundColor Green
}
catch {
  $raw = $_.ErrorDetails.Message
  if ($raw) {
    Write-Section "오류 응답"
    try {
      $json = $raw | ConvertFrom-Json
      if ($json.error) {
        Write-Host "error.code    : $($json.error.code)"
        Write-Host "error.message : $($json.error.message)"
      } else {
        Write-Host $raw
      }
    } catch {
      Write-Host $raw
    }
  }

  Write-Host "[FAIL] 테스트 실패" -ForegroundColor Red
  throw
}
