import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  createChatUser,
  getChatUserByPhone,
  getChatUserById,
  updateChatUser,
  getOrCreateConversation,
  getConversations,
  sendMessage,
  getMessages,
  createFruit,
  getFruits,
  updateFruit,
  deleteFruit,
} from "./db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

export const chatRouter = router({
  // User registration
  registerUser: publicProcedure
    .input(
      z.object({
        phone: z.string().min(10, "Phone number must be at least 10 digits"),
        name: z.string().min(1, "Name is required"),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await getChatUserByPhone(input.phone);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User with this phone number already exists",
          });
        }

        // Create new user
        const user = await createChatUser({
          phone: input.phone,
          name: input.name,
          address: input.address,
        });

        return {
          success: true,
          userId: user.id,
          user,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register user",
        });
      }
    }),

  // Upload user image
  uploadImage: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        imageBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Verify user exists
        const user = await getChatUserById(input.userId);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Validate base64 format
        if (!input.imageBase64 || input.imageBase64.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image data is empty",
          });
        }

        // Validate file size (max 5MB)
        const buffer = Buffer.from(input.imageBase64, "base64");
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (buffer.length > maxSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image size exceeds 5MB limit",
          });
        }

        // Validate MIME type
        const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!validMimeTypes.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid image format. Supported: JPEG, PNG, GIF, WebP",
          });
        }

        // Upload to ImgBB
        const formData = new URLSearchParams();
        formData.append("key", "3dfddeb29f2b603514006a0931f529c3");
        formData.append("image", input.imageBase64);

        const imgBbRes = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
        });
        
        const imgBbData = await imgBbRes.json();
        if (!imgBbData.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "ImgBB upload failed: " + JSON.stringify(imgBbData),
          });
        }

        const url = imgBbData.data.url;
        const key = imgBbData.data.id;

        // Update user with image URL
        await updateChatUser(input.userId, {
          imageUrl: url,
          imageKey: key,
        });

        return {
          success: true,
          imageUrl: url,
          imageKey: key,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload image",
        });
      }
    }),

  // Get user profile
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      try {
        const user = await getChatUserById(input.userId);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return user;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }
    }),

  // Get or create conversation
  getOrCreateConversation: publicProcedure
    .input(
      z.object({
        user1Id: z.number(),
        user2Id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (input.user1Id === input.user2Id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot create conversation with the same user",
          });
        }

        // Verify both users exist
        const user1 = await getChatUserById(input.user1Id);
        const user2 = await getChatUserById(input.user2Id);

        if (!user1 || !user2) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or both users not found",
          });
        }

        const conversation = await getOrCreateConversation(
          input.user1Id,
          input.user2Id
        );

        return conversation;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get or create conversation",
        });
      }
    }),

  // Get all conversations for a user
  getConversations: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      try {
        // Verify user exists
        const user = await getChatUserById(input.userId);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const convs = await getConversations(input.userId);

        // Enrich conversations with user details
        const enrichedConvs = await Promise.all(
          convs.map(async (conv) => {
            const otherUserId =
              conv.user1Id === input.userId ? conv.user2Id : conv.user1Id;
            const otherUser = await getChatUserById(otherUserId);

            return {
              ...conv,
              otherUser,
            };
          })
        );

        return enrichedConvs;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

  // Send message
  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.number(),
        senderId: z.number(),
        content: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Verify sender exists
        const sender = await getChatUserById(input.senderId);
        if (!sender) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sender not found",
          });
        }

        const message = await sendMessage(
          input.conversationId,
          input.senderId,
          input.content
        );

        return {
          success: true,
          message,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  // Get messages for a conversation
  getMessages: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      try {
        const msgs = await getMessages(input.conversationId);

        // Enrich messages with sender details
        const enrichedMsgs = await Promise.all(
          msgs.map(async (msg) => {
            const sender = await getChatUserById(msg.senderId);
            return {
              ...msg,
              sender,
            };
          })
        );

        return enrichedMsgs;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
    }),

  // Fruits / Posts endpoints
  createFruit: publicProcedure
    .input(
      z.object({
        sellerId: z.number(),
        name: z.string(),
        phone: z.string(),
        address: z.string().optional(),
        quantity: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const fruit = await createFruit({
          ...input,
          status: 'available',
        });
        return { success: true, fruit };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create fruit" });
      }
    }),

  getFruits: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      try {
        const fruitsList = await getFruits(input?.userId);
        return fruitsList;
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch fruits" });
      }
    }),

  updateFruit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        sellerId: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        quantity: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
        status: z.enum(["available", "sold"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, sellerId, ...data } = input;
        
        const updateData: any = { ...data };
        if (data.status === 'sold') {
          updateData.soldAt = new Date();
        } else if (data.status === 'available') {
          updateData.soldAt = null;
        }

        await updateFruit(id, sellerId, updateData);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to update fruit" });
      }
    }),

  deleteFruit: publicProcedure
    .input(z.object({ id: z.number(), sellerId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteFruit(input.id, input.sellerId);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to delete fruit" });
      }
    }),
});
