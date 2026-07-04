import { eq, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, chatUsers, conversations, messages, fruits } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { InsertChatUser, ChatUser, Conversation, Message, InsertFruit, Fruit } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Chat application database queries

export async function createChatUser(data: InsertChatUser): Promise<ChatUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(chatUsers).values(data);
  
  // Get the created user by phone (unique identifier)
  const user = await db.select().from(chatUsers).where(eq(chatUsers.phone, data.phone!)).limit(1);
  if (!user.length) throw new Error("Failed to create user");
  
  return user[0];
}

export async function getChatUserByPhone(phone: string): Promise<ChatUser | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(chatUsers).where(eq(chatUsers.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getChatUserById(id: number): Promise<ChatUser | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(chatUsers).where(eq(chatUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateChatUser(id: number, data: Partial<InsertChatUser>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(chatUsers).set(data).where(eq(chatUsers.id, id));
}

export async function getOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure consistent ordering
  const [minId, maxId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
  
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.user1Id, minId),
        eq(conversations.user2Id, maxId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  await db.insert(conversations).values({
    user1Id: minId,
    user2Id: maxId,
  });
  
  // Get the newly created conversation
  const newConv = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.user1Id, minId),
        eq(conversations.user2Id, maxId)
      )
    )
    .limit(1);
  
  if (!newConv.length) throw new Error("Failed to create conversation");
  
  return newConv[0];
}

export async function getConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(conversations)
    .where(
      or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      )
    );
}

export async function sendMessage(conversationId: number, senderId: number, content: string): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First, verify the conversation exists
  const conv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  
  if (!conv.length) throw new Error("Conversation not found");
  
  // Verify sender is part of the conversation
  const conversation = conv[0];
  if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
    throw new Error("Sender is not part of this conversation");
  }
  
  await db.insert(messages).values({
    conversationId,
    senderId,
    content,
  });
  
  // Get the most recent message from this conversation by this sender
  const msg = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, senderId)
      )
    )
    .orderBy(messages.createdAt);
  
  if (!msg.length) throw new Error("Failed to send message");
  
  // Return the most recent message (last in the ordered list)
  return msg[msg.length - 1];
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}
// Fruits / Posts database queries

export async function createFruit(data: InsertFruit): Promise<Fruit> {
  const db = await getDb();
  if (!db) throw new Error(""Database not available"");
  
  const [result] = await db.insert(fruits).values(data);
  const insertId = (result as any).insertId;
  
  const created = await db.select().from(fruits).where(eq(fruits.id, insertId)).limit(1);
  return created[0];
}

export async function getFruits(userId?: number): Promise<Fruit[]> {
  const db = await getDb();
  if (!db) throw new Error(""Database not available"");
  
  // If userId is provided, return all fruits for that user (both available and sold)
  if (userId) {
    return db.select().from(fruits).where(eq(fruits.sellerId, userId)).orderBy(fruits.createdAt);
  }
  
  // Otherwise, return all available fruits, and sold fruits if soldAt is within the last 10 minutes
  const allFruits = await db.select().from(fruits).orderBy(fruits.createdAt);
  
  const now = new Date();
  return allFruits.filter(fruit => {
    if (fruit.status === 'available') return true;
    if (fruit.status === 'sold' && fruit.soldAt) {
      const diffMinutes = (now.getTime() - fruit.soldAt.getTime()) / (1000 * 60);
      return diffMinutes <= 10;
    }
    return false;
  });
}

export async function updateFruit(id: number, sellerId: number, data: Partial<InsertFruit>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error(""Database not available"");
  
  // Verify ownership
  const existing = await db.select().from(fruits).where(and(eq(fruits.id, id), eq(fruits.sellerId, sellerId))).limit(1);
  if (!existing.length) throw new Error(""Fruit not found or unauthorized"");
  
  await db.update(fruits).set(data).where(eq(fruits.id, id));
}

export async function deleteFruit(id: number, sellerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error(""Database not available"");
  
  // Verify ownership
  const existing = await db.select().from(fruits).where(and(eq(fruits.id, id), eq(fruits.sellerId, sellerId))).limit(1);
  if (!existing.length) throw new Error(""Fruit not found or unauthorized"");
  
  await db.delete(fruits).where(eq(fruits.id, id));
}
