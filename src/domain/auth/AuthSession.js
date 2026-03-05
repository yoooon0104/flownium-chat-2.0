// 세션 토큰 로드/저장/삭제를 객체 형태로 묶어 인증 책임을 분리한다.
export const AuthSession = {
  load() {
    return {
      accessToken: localStorage.getItem('accessToken') || '',
      refreshToken: localStorage.getItem('refreshToken') || '',
    }
  },

  save(tokens) {
    localStorage.setItem('accessToken', String(tokens.accessToken || ''))
    localStorage.setItem('refreshToken', String(tokens.refreshToken || ''))
  },

  clear() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
}
