# API Specification

Base URL: /api

---

## Auth

GET /auth/kakao/callback
- 카카오 로그인 처리
- JWT 발급

POST /auth/refresh
- Access Token 재발급

---

## Users

GET /users/me
- 현재 로그인 사용자 조회
- JWT 필요

GET /users/search?keyword=
- 사용자 검색
- JWT 필요

---

## ChatRooms

GET /chatrooms
- 로그인 사용자 채팅방 목록 조회
- lastMessage 포함

POST /chatrooms
- 1:1 채팅방 생성
- 중복 시 기존 방 반환

GET /chatrooms/:id
- 채팅방 상세 조회

---

## Messages

GET /chatrooms/:id/messages
- 메시지 히스토리 조회
- 페이징 지원