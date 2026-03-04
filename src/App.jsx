import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const SOCKET_SERVER_URL = 'http://localhost:3010'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [socketId, setSocketId] = useState('')

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL)

    socket.on('connect', () => {
      setIsConnected(true)
      setSocketId(socket.id)
      console.log('Connected to socket server:', socket.id)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setSocketId('')
      console.log('Disconnected from socket server')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <main>
      <h1>Socket.IO Connection Test</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Socket ID: {socketId || 'Not connected yet'}</p>
      <p>Server: {SOCKET_SERVER_URL}</p>
    </main>
  )
}

export default App
