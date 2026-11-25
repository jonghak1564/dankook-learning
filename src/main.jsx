import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 글꼴: Pretendard를 서버에서 직접 제공 (화면에 쓰인 글자 묶음만 받는다). SIL OFL 1.1
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './index.css'
import './tokens.css' // 디자인 토큰 (Storybook 「Foundations」)
import AdminApp from './AdminApp.jsx'
import App from './App.jsx'

// 페이지 2개 (라우터 없이 주소만 본다): /  퀴즈,  /admin  관리
const path = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = path === '/admin' ? AdminApp : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
