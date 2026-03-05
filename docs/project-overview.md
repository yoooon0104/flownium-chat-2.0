# Flownium Chat

## Project Goal

Flownium Chat is a Kakao OAuth + JWT based real-time chat service.
Current MVP target is group chat, not 1:1 chat.

## MVP Scope (Phase 1)

- Kakao OAuth login
- JWT access/refresh token auth
- Group room create/list/join
- Message save + real-time delivery
- Room participants view (all members + online/offline)
- Last message and last message time update

## Out of Scope (Next Phase)

- Admin role / invite / kick policy
- Forced leave policy
- Advanced permission model

## Room Rules (Current)

- Room ID is Mongo ObjectId string
- Room creator is initial member
- Join request adds user to memberIds if not present
- Participant online state is socket presence based
