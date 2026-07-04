# Chat Backend Server - TODO

## Phase 1: Database Schema
- [x] Create users table with fields: id, phone, name, image, address, createdAt, updatedAt
- [x] Create conversations table with fields: id, user1Id, user2Id, createdAt, updatedAt
- [x] Create messages table with fields: id, conversationId, senderId, content, createdAt
- [x] Generate and apply Drizzle migrations

## Phase 2: API Endpoints
- [x] POST /api/chat/registerUser - Register new user
- [x] POST /api/chat/uploadImage - Upload user image
- [x] GET /api/chat/getUserProfile - Get user profile
- [x] POST /api/chat/sendMessage - Send message
- [x] GET /api/chat/getMessages - Get messages for conversation
- [x] GET /api/chat/getConversations - Get all conversations for user
- [x] POST /api/chat/getOrCreateConversation - Create or get conversation between two users

## Phase 3: Documentation Page
- [x] Create API documentation page with all endpoints
- [x] Add request/response examples
- [x] Add interactive API tester

## Phase 4: Testing
- [x] Test user registration
- [x] Test image upload
- [x] Test message sending/receiving
- [x] Test conversation retrieval

## Phase 5: Deployment
- [x] Deploy to production
- [x] Provide API documentation to user
