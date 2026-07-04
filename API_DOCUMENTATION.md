# Chat API Server - توثيق شامل

## مقدمة

**Chat API Server** هو خادم متكامل لتطبيق دردشة يوفر جميع الميزات اللازمة لتطبيق مراسلة فورية. يدعم تسجيل المستخدمين، تحميل الصور، إنشاء المحادثات، وتبادل الرسائل بين المستخدمين.

---

## معلومات الاتصال

| المعلومة | القيمة |
|---------|--------|
| **Base URL** | `https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc` |
| **Protocol** | HTTPS |
| **Content-Type** | `application/json` |
| **Response Format** | JSON |

---

## نقاط الـ API (Endpoints)

### 1. تسجيل مستخدم جديد

**Endpoint:** `POST /api/trpc/chat.registerUser`

**الوصف:** تسجيل مستخدم جديد في التطبيق مع بيانات الملف الشخصي الأساسية.

**متطلبات الطلب:**

```json
{
  "input": {
    "phone": "string (رقم هاتف، 10 أرقام على الأقل)",
    "name": "string (الاسم، مطلوب)",
    "address": "string (العنوان، اختياري)"
  }
}
```

**مثال على الطلب:**

```bash
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.registerUser \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "phone": "966501234567",
      "name": "أحمد محمد",
      "address": "الرياض، السعودية"
    }
  }'
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "userId": 1,
  "user": {
    "id": 1,
    "phone": "966501234567",
    "name": "أحمد محمد",
    "address": "الرياض، السعودية",
    "imageUrl": null,
    "imageKey": null,
    "createdAt": "2026-06-28T18:30:00.000Z",
    "updatedAt": "2026-06-28T18:30:00.000Z"
  }
}
```

**رموز الأخطاء:**
- `CONFLICT` - رقم الهاتف موجود بالفعل
- `BAD_REQUEST` - بيانات غير صحيحة

---

### 2. الحصول على بيانات المستخدم

**Endpoint:** `GET /api/trpc/chat.getUserProfile`

**الوصف:** الحصول على بيانات ملف المستخدم الشخصي.

**متطلبات الطلب:**

```json
{
  "input": {
    "userId": "number (معرف المستخدم)"
  }
}
```

**مثال على الطلب:**

```bash
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.getUserProfile \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "userId": 1
    }
  }'
```

**الاستجابة الناجحة:**

```json
{
  "id": 1,
  "phone": "966501234567",
  "name": "أحمد محمد",
  "address": "الرياض، السعودية",
  "imageUrl": "https://storage.example.com/chat-users/1/profile.jpg",
  "imageKey": "chat-users/1/profile.jpg",
  "createdAt": "2026-06-28T18:30:00.000Z",
  "updatedAt": "2026-06-28T18:30:00.000Z"
}
```

**رموز الأخطاء:**
- `NOT_FOUND` - المستخدم غير موجود

---

### 3. تحميل صورة المستخدم

**Endpoint:** `POST /api/trpc/chat.uploadImage`

**الوصف:** تحميل صورة الملف الشخصي للمستخدم.

**متطلبات الطلب:**

```json
{
  "input": {
    "userId": "number (معرف المستخدم)",
    "imageBase64": "string (الصورة بصيغة Base64)",
    "fileName": "string (اسم الملف)",
    "mimeType": "string (نوع الملف: image/jpeg, image/png, image/gif, image/webp)"
  }
}
```

**ملاحظات مهمة:**
- الحد الأقصى لحجم الصورة: 5 MB
- الصيغ المدعومة: JPEG, PNG, GIF, WebP
- يجب تحويل الصورة إلى Base64 قبل الإرسال

**مثال على الطلب:**

```bash
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.uploadImage \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "userId": 1,
      "fileName": "profile.jpg",
      "mimeType": "image/jpeg",
      "imageBase64": "/9j/4AAQSkZJRg..."
    }
  }'
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "imageUrl": "https://storage.example.com/chat-users/1/profile.jpg",
  "imageKey": "chat-users/1/profile.jpg"
}
```

**رموز الأخطاء:**
- `NOT_FOUND` - المستخدم غير موجود
- `BAD_REQUEST` - بيانات الصورة غير صحيحة أو الحجم كبير جداً

---

### 4. إنشاء أو الحصول على محادثة

**Endpoint:** `POST /api/trpc/chat.getOrCreateConversation`

**الوصف:** إنشاء محادثة جديدة بين مستخدمين أو الحصول على محادثة موجودة.

**متطلبات الطلب:**

```json
{
  "input": {
    "user1Id": "number (معرف المستخدم الأول)",
    "user2Id": "number (معرف المستخدم الثاني)"
  }
}
```

**مثال على الطلب:**

```bash
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.getOrCreateConversation \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user1Id": 1,
      "user2Id": 2
    }
  }'
```

**الاستجابة الناجحة:**

```json
{
  "id": 1,
  "user1Id": 1,
  "user2Id": 2,
  "createdAt": "2026-06-28T18:30:00.000Z",
  "updatedAt": "2026-06-28T18:30:00.000Z"
}
```

**رموز الأخطاء:**
- `NOT_FOUND` - أحد المستخدمين غير موجود
- `BAD_REQUEST` - لا يمكن إنشاء محادثة مع نفس المستخدم

---

### 5. الحصول على محادثات المستخدم

**Endpoint:** `GET /api/trpc/chat.getConversations`

**الوصف:** الحصول على جميع المحادثات الخاصة بمستخدم معين.

**متطلبات الطلب:**

```json
{
  "input": {
    "userId": "number (معرف المستخدم)"
  }
}
```

**مثال على الطلب:**

```bash
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.getConversations \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "userId": 1
    }
  }'
```

**الاستجابة الناجحة:**

```json
[
  {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "otherUser": {
      "id": 2,
      "phone": "966509876543",
      "name": "فاطمة علي",
      "imageUrl": null
    },
    "createdAt": "2026-06-28T18:30:00.000Z",
    "updatedAt": "2026-06-28T18:30:00.000Z"
  }
]
```

**رموز الأخطاء:**
- `NOT_FOUND` - المستخدم غير موجود

---

### 6. إرسال رسالة

**Endpoint:** `POST /api/trpc/chat.sendMessage`

**الوصف:** إرسال رسالة نصية في محادثة.

**متطلبات الطلب:**

```json
{
  "input": {
    "conversationId": "number (معرف المحادثة)",
    "senderId": "number (معرف المرسل)",
    "content": "string (محتوى الرسالة، غير فارغ)"
  }
}
```

**مثال على الطلب:**

```bash
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "conversationId": 1,
      "senderId": 1,
      "content": "مرحبا! كيف حالك؟"
    }
  }'
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "message": {
    "id": 1,
    "conversationId": 1,
    "senderId": 1,
    "content": "مرحبا! كيف حالك؟",
    "createdAt": "2026-06-28T18:30:00.000Z"
  }
}
```

**رموز الأخطاء:**
- `NOT_FOUND` - المرسل غير موجود
- `BAD_REQUEST` - الرسالة فارغة

---

### 7. الحصول على رسائل المحادثة

**Endpoint:** `GET /api/trpc/chat.getMessages`

**الوصف:** الحصول على جميع الرسائل في محادثة معينة.

**متطلبات الطلب:**

```json
{
  "input": {
    "conversationId": "number (معرف المحادثة)"
  }
}
```

**مثال على الطلب:**

```bash
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.getMessages \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "conversationId": 1
    }
  }'
```

**الاستجابة الناجحة:**

```json
[
  {
    "id": 1,
    "conversationId": 1,
    "senderId": 1,
    "content": "مرحبا! كيف حالك؟",
    "sender": {
      "id": 1,
      "name": "أحمد محمد",
      "phone": "966501234567",
      "imageUrl": null
    },
    "createdAt": "2026-06-28T18:30:00.000Z"
  },
  {
    "id": 2,
    "conversationId": 1,
    "senderId": 2,
    "content": "أنا بخير، شكراً لك!",
    "sender": {
      "id": 2,
      "name": "فاطمة علي",
      "phone": "966509876543",
      "imageUrl": null
    },
    "createdAt": "2026-06-28T18:30:01.000Z"
  }
]
```

---

## معالجة الأخطاء

جميع الأخطاء تُرجع رسالة خطأ بالصيغة التالية:

```json
{
  "code": "ERROR_CODE",
  "message": "رسالة الخطأ"
}
```

### رموز الأخطاء الشائعة

| الرمز | الوصف |
|------|-------|
| `NOT_FOUND` | المورد المطلوب غير موجود |
| `BAD_REQUEST` | بيانات الطلب غير صحيحة |
| `CONFLICT` | تضارب في البيانات (مثل رقم هاتف مكرر) |
| `INTERNAL_SERVER_ERROR` | خطأ في الخادم |

---

## ملاحظات مهمة

1. **جميع الطلبات تُرسل عبر POST**: حتى العمليات التي تبدو كقراءة (GET) يجب أن تُرسل عبر POST إلى نقاط tRPC.

2. **تنسيق التاريخ والوقت**: جميع التواريخ تُرجع بصيغة ISO 8601 (UTC).

3. **معرفات المستخدمين والمحادثات**: معرفات فريدة عددية يتم إنشاؤها تلقائياً من قبل الخادم.

4. **رقم الهاتف الفريد**: لا يمكن تسجيل مستخدمين بنفس رقم الهاتف.

5. **تحميل الصور**: يجب تحويل الصورة إلى Base64 قبل الإرسال.

---

## أمثلة عملية

### مثال 1: تسجيل مستخدم وتحميل صورة

```bash
# الخطوة 1: تسجيل مستخدم جديد
USER_RESPONSE=$(curl -s -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.registerUser \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "phone": "966501234567",
      "name": "أحمد محمد",
      "address": "الرياض"
    }
  }')

USER_ID=$(echo $USER_RESPONSE | grep -o '"userId":[0-9]*' | cut -d: -f2)

# الخطوة 2: تحميل صورة المستخدم
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.uploadImage \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"userId\": $USER_ID,
      \"fileName\": \"profile.jpg\",
      \"mimeType\": \"image/jpeg\",
      \"imageBase64\": \"/9j/4AAQSkZJRg...\"
    }
  }"
```

### مثال 2: إنشاء محادثة وإرسال رسالة

```bash
# الخطوة 1: إنشاء محادثة
CONV_RESPONSE=$(curl -s -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.getOrCreateConversation \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user1Id": 1,
      "user2Id": 2
    }
  }')

CONV_ID=$(echo $CONV_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

# الخطوة 2: إرسال رسالة
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"conversationId\": $CONV_ID,
      \"senderId\": 1,
      \"content\": \"مرحبا!\"
    }
  }"

# الخطوة 3: الحصول على الرسائل
curl -X POST https://3000-i8wbn97uv7gdq4pqzq1ug-129667c4.us1.manus.computer/api/trpc/chat.getMessages \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"conversationId\": $CONV_ID
    }
  }"
```

---

## الدعم والمساعدة

للمزيد من المعلومات أو الإبلاغ عن مشاكل، يرجى الاتصال بفريق الدعم.

---

**آخر تحديث:** 28 يونيو 2026
