import AppShell from './app/AppShell'

// App는 진입점 역할만 담당하고 실제 기능 조합은 AppShell로 위임한다.
function App() {
  return <AppShell />
}

export default App
