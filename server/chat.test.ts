import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Create a mock context for testing
function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Chat API Tests", () => {
  let userId1: number;
  let userId2: number;
  let conversationId: number;
  let messageId: number;

  const caller = appRouter.createCaller(createMockContext());

  describe("User Registration", () => {
    it("should register a new user successfully", async () => {
      const result = await caller.chat.registerUser({
        phone: "966501234567",
        name: "أحمد محمد",
        address: "الرياض، السعودية",
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.user.phone).toBe("966501234567");
      expect(result.user.name).toBe("أحمد محمد");

      userId1 = result.userId;
    });

    it("should register another user", async () => {
      const result = await caller.chat.registerUser({
        phone: "966509876543",
        name: "فاطمة علي",
        address: "جدة، السعودية",
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();

      userId2 = result.userId;
    });

    it("should reject duplicate phone numbers", async () => {
      try {
        await caller.chat.registerUser({
          phone: "966501234567",
          name: "محمد أحمد",
          address: "الدمام",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("CONFLICT");
      }
    });
  });

  describe("User Profile", () => {
    it("should retrieve user profile", async () => {
      const result = await caller.chat.getUserProfile({
        userId: userId1,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(userId1);
      expect(result.phone).toBe("966501234567");
      expect(result.name).toBe("أحمد محمد");
    });

    it("should return NOT_FOUND for non-existent user", async () => {
      try {
        await caller.chat.getUserProfile({
          userId: 99999,
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("Conversations", () => {
    it("should create a new conversation", async () => {
      const result = await caller.chat.getOrCreateConversation({
        user1Id: userId1,
        user2Id: userId2,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect([result.user1Id, result.user2Id]).toContain(userId1);
      expect([result.user1Id, result.user2Id]).toContain(userId2);

      conversationId = result.id;
    });

    it("should return existing conversation", async () => {
      const result = await caller.chat.getOrCreateConversation({
        user1Id: userId1,
        user2Id: userId2,
      });

      expect(result.id).toBe(conversationId);
    });

    it("should reject conversation with same user", async () => {
      try {
        await caller.chat.getOrCreateConversation({
          user1Id: userId1,
          user2Id: userId1,
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should get user conversations", async () => {
      const result = await caller.chat.getConversations({
        userId: userId1,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe(conversationId);
    });
  });

  describe("Messages", () => {
    it("should send a message", async () => {
      const result = await caller.chat.sendMessage({
        conversationId,
        senderId: userId1,
        content: "مرحبا! كيف حالك؟",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message.conversationId).toBe(conversationId);
      expect(result.message.senderId).toBe(userId1);
      expect(result.message.content).toBe("مرحبا! كيف حالك؟");

      messageId = result.message.id;
    });

    it("should send another message from different user", async () => {
      const result = await caller.chat.sendMessage({
        conversationId,
        senderId: userId2,
        content: "أنا بخير، شكراً لك!",
      });

      expect(result.success).toBe(true);
      expect(result.message.senderId).toBe(userId2);
    });

    it("should reject empty messages", async () => {
      try {
        await caller.chat.sendMessage({
          conversationId,
          senderId: userId1,
          content: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should get conversation messages", async () => {
      const result = await caller.chat.getMessages({
        conversationId,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].conversationId).toBe(conversationId);
      expect(result[0].sender).toBeDefined();
    });

    it("should have messages in correct order", async () => {
      const result = await caller.chat.getMessages({
        conversationId,
      });

      // Check that messages are ordered by creation time
      for (let i = 1; i < result.length; i++) {
        const prevTime = new Date(result[i - 1].createdAt).getTime();
        const currTime = new Date(result[i].createdAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  describe("Image Upload", () => {
    it("should upload user image", async () => {
      // Create a simple base64 encoded image (1x1 pixel JPEG)
      const base64Image =
        "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

      const result = await caller.chat.uploadImage({
        userId: userId1,
        imageBase64: base64Image,
        fileName: "profile.jpg",
        mimeType: "image/jpeg",
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.imageKey).toBeDefined();
    });

    it("should reject invalid image format", async () => {
      try {
        await caller.chat.uploadImage({
          userId: userId1,
          imageBase64: "invalid-base64",
          fileName: "test.txt",
          mimeType: "text/plain",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should reject empty image", async () => {
      try {
        await caller.chat.uploadImage({
          userId: userId1,
          imageBase64: "",
          fileName: "empty.jpg",
          mimeType: "image/jpeg",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });
});
