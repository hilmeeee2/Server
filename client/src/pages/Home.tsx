import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  example?: string;
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/trpc/chat.registerUser",
    description: "تسجيل مستخدم جديد في التطبيق",
    request: {
      input: {
        phone: "string (min 10 digits)",
        name: "string (required)",
        address: "string (optional)",
      },
    },
    response: {
      success: "boolean",
      userId: "number",
      user: {
        id: "number",
        phone: "string",
        name: "string",
        address: "string | null",
        imageUrl: "string | null",
        createdAt: "Date",
        updatedAt: "Date",
      },
    },
    example: JSON.stringify(
      {
        input: {
          phone: "966501234567",
          name: "أحمد محمد",
          address: "الرياض، السعودية",
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/trpc/chat.uploadImage",
    description: "رفع صورة المستخدم",
    request: {
      input: {
        userId: "number",
        imageBase64: "string (base64 encoded image)",
        fileName: "string",
        mimeType: "string (image/jpeg, image/png, image/gif, image/webp)",
      },
    },
    response: {
      success: "boolean",
      imageUrl: "string",
      imageKey: "string",
    },
    example: JSON.stringify(
      {
        input: {
          userId: 1,
          fileName: "profile.jpg",
          mimeType: "image/jpeg",
          imageBase64: "/9j/4AAQSkZJRg...",
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/trpc/chat.getUserProfile",
    description: "الحصول على بيانات المستخدم",
    request: {
      input: {
        userId: "number",
      },
    },
    response: {
      id: "number",
      phone: "string",
      name: "string",
      address: "string | null",
      imageUrl: "string | null",
      imageKey: "string | null",
      createdAt: "Date",
      updatedAt: "Date",
    },
    example: JSON.stringify(
      {
        input: {
          userId: 1,
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/trpc/chat.getOrCreateConversation",
    description: "الحصول على أو إنشاء محادثة بين مستخدمين",
    request: {
      input: {
        user1Id: "number",
        user2Id: "number",
      },
    },
    response: {
      id: "number",
      user1Id: "number",
      user2Id: "number",
      createdAt: "Date",
      updatedAt: "Date",
    },
    example: JSON.stringify(
      {
        input: {
          user1Id: 1,
          user2Id: 2,
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/trpc/chat.getConversations",
    description: "الحصول على جميع محادثات المستخدم",
    request: {
      input: {
        userId: "number",
      },
    },
    response: {
      type: "array",
      items: {
        id: "number",
        user1Id: "number",
        user2Id: "number",
        otherUser: {
          id: "number",
          phone: "string",
          name: "string",
        },
        createdAt: "Date",
        updatedAt: "Date",
      },
    },
    example: JSON.stringify(
      {
        input: {
          userId: 1,
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/trpc/chat.sendMessage",
    description: "إرسال رسالة في محادثة",
    request: {
      input: {
        conversationId: "number",
        senderId: "number",
        content: "string (non-empty)",
      },
    },
    response: {
      success: "boolean",
      message: {
        id: "number",
        conversationId: "number",
        senderId: "number",
        content: "string",
        createdAt: "Date",
      },
    },
    example: JSON.stringify(
      {
        input: {
          conversationId: 1,
          senderId: 1,
          content: "مرحبا! كيف حالك؟",
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/trpc/chat.getMessages",
    description: "الحصول على رسائل محادثة",
    request: {
      input: {
        conversationId: "number",
      },
    },
    response: {
      type: "array",
      items: {
        id: "number",
        conversationId: "number",
        senderId: "number",
        content: "string",
        sender: {
          id: "number",
          name: "string",
          phone: "string",
          imageUrl: "string | null",
        },
        createdAt: "Date",
      },
    },
    example: JSON.stringify(
      {
        input: {
          conversationId: 1,
        },
      },
      null,
      2
    ),
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 w-8 p-0"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800",
    POST: "bg-green-100 text-green-800",
    PUT: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
  };

  return <Badge className={colors[method] || "bg-gray-100 text-gray-800"}>{method}</Badge>;
}

export default function Home() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Chat API Documentation</h1>
          <p className="text-lg text-slate-600">
            توثيق شامل لجميع نقاط الـ API الخاصة بتطبيق الدردشة
          </p>
        </div>

        {/* Introduction Card */}
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle>مقدمة عن الـ API</CardTitle>
            <CardDescription>معلومات عامة عن كيفية استخدام الـ API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Base URL</h3>
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-lg">
                <code className="text-sm text-slate-700 flex-1">
                  {window.location.origin}/api/trpc
                </code>
                <CopyButton text={`${window.location.origin}/api/trpc`} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Request Format</h3>
              <p className="text-slate-700 mb-2">
                جميع الطلبات يجب أن تكون بصيغة JSON مع رأس المعلومات:
              </p>
              <div className="bg-slate-100 p-3 rounded-lg">
                <code className="text-sm text-slate-700">
                  Content-Type: application/json
                </code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Response Format</h3>
              <p className="text-slate-700">
                جميع الاستجابات تأتي بصيغة JSON مع حالة النجاح أو الخطأ
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints Documentation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoints List */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">جميع النقاط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {endpoints.map((endpoint, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEndpoint(idx)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedEndpoint === idx
                          ? "bg-blue-100 border-l-4 border-blue-500"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MethodBadge method={endpoint.method} />
                        <span className="text-xs text-slate-600 truncate">
                          {endpoint.path.split("/").pop()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2">
                        {endpoint.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Endpoint Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">التفاصيل</TabsTrigger>
                <TabsTrigger value="request">الطلب</TabsTrigger>
                <TabsTrigger value="response">الاستجابة</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <MethodBadge method={endpoints[selectedEndpoint].method} />
                      <code className="text-sm text-slate-700 flex-1 truncate">
                        {endpoints[selectedEndpoint].path}
                      </code>
                      <CopyButton text={endpoints[selectedEndpoint].path} />
                    </div>
                    <CardTitle className="text-lg">
                      {endpoints[selectedEndpoint].description}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>ملاحظة:</strong> جميع الطلبات يجب أن تُرسل عبر POST إلى{" "}
                        <code className="bg-white px-2 py-1 rounded">
                          {endpoints[selectedEndpoint].path}
                        </code>
                        ، حتى لو كانت عملية قراءة (GET).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="request" className="space-y-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">صيغة الطلب</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {endpoints[selectedEndpoint].example ? (
                      <div className="relative">
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                          {endpoints[selectedEndpoint].example}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <CopyButton
                            text={endpoints[selectedEndpoint].example || "{}"}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600">لا توجد أمثلة متاحة</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="response" className="space-y-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">صيغة الاستجابة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(endpoints[selectedEndpoint].response, null, 2)}
                      </pre>
                      <div className="absolute top-2 right-2">
                        <CopyButton
                          text={JSON.stringify(endpoints[selectedEndpoint].response, null, 2)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card className="mt-8 border-slate-200">
          <CardHeader>
            <CardTitle>دليل البدء السريع</CardTitle>
            <CardDescription>خطوات بسيطة للبدء في استخدام الـ API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">1. تسجيل مستخدم جديد</h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-slate-100 text-sm overflow-x-auto">
                  {`curl -X POST ${window.location.origin}/api/trpc/chat.registerUser \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "phone": "966501234567",
      "name": "أحمد محمد",
      "address": "الرياض"
    }
  }'`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">2. الحصول على بيانات المستخدم</h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-slate-100 text-sm overflow-x-auto">
                  {`curl -X POST ${window.location.origin}/api/trpc/chat.getUserProfile \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "userId": 1
    }
  }'`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">3. إنشاء محادثة وإرسال رسالة</h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-slate-100 text-sm overflow-x-auto">
                  {`# أولاً: إنشاء محادثة
curl -X POST ${window.location.origin}/api/trpc/chat.getOrCreateConversation \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "user1Id": 1,
      "user2Id": 2
    }
  }'

# ثانياً: إرسال رسالة
curl -X POST ${window.location.origin}/api/trpc/chat.sendMessage \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "conversationId": 1,
      "senderId": 1,
      "content": "مرحبا!"
    }
  }'`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card className="mt-8 border-slate-200">
          <CardHeader>
            <CardTitle>معالجة الأخطاء</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">رموز الأخطاء الشائعة</h3>
              <div className="space-y-2">
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="font-mono text-sm text-red-900">
                    <strong>NOT_FOUND</strong> - المورد المطلوب غير موجود
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="font-mono text-sm text-red-900">
                    <strong>BAD_REQUEST</strong> - بيانات الطلب غير صحيحة
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="font-mono text-sm text-red-900">
                    <strong>CONFLICT</strong> - تضارب في البيانات (مثل رقم هاتف مكرر)
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="font-mono text-sm text-red-900">
                    <strong>INTERNAL_SERVER_ERROR</strong> - خطأ في الخادم
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-600">
          <p>© 2026 Chat API Server. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  );
}
