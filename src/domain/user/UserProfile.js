// 사용자 표기 규칙(닉네임/아바타 이니셜)을 도메인 객체로 분리한다.
export const UserProfile = {
  normalize(user) {
    const safe = user || {}
    return {
      id: String(safe.id || ''),
      kakaoId: String(safe.kakaoId || ''),
      email: String(safe.email || '').trim().toLowerCase(),
      nickname: String(safe.nickname || '').trim(),
      profileImage: String(safe.profileImage || '').trim(),
    }
  },

  getDisplayName(user) {
    const normalized = this.normalize(user)
    return normalized.nickname || '게스트'
  },

  getInitial(user) {
    const name = this.getDisplayName(user)
    return name.slice(0, 1).toUpperCase()
  },
}
