import { io } from 'socket.io-client'

// Socket.IO 클라이언트 생성 책임을 서비스로 분리해 훅/컴포넌트 결합을 낮춘다.
export const createChatSocketClient = (apiBaseUrl, accessToken) => {
  return io(apiBaseUrl, {
    autoConnect: true,
    auth: { token: accessToken },
  })
}
