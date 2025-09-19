'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Bot,
  MessageCircle,
  Activity,
  Monitor,
  Download,
  Archive,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'bot' | 'system';
  messageType: 'text' | 'quick_reply' | 'rich_content' | 'media' | 'system';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
  metadata?: Record<string, any>;
}

interface ChatSessionDetail {
  id: string;
  sessionId: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  lastActivity: string;
  messageCount: number;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  guestEmail?: string;
  guestPhone?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  messages: ChatMessage[];
}

export default function SessionDetailPage() {
  const {} = useSession();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionDetail, setSessionDetail] = useState<ChatSessionDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/chat/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }

      const data = await response.json();
      setSessionDetail(data.session);
    } catch (error) {
      console.error('Error fetching session details:', error);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      const response = await fetch(
        `/api/admin/chat/sessions/${sessionId}/end`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        fetchSessionDetail(); // Refresh data
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleExportChat = async () => {
    if (!sessionDetail) {
      return;
    }

    const chatData = {
      session: {
        id: sessionDetail.sessionId,
        status: sessionDetail.status,
        startedAt: sessionDetail.startedAt,
        endedAt: sessionDetail.endedAt,
        duration: calculateDuration(),
        user: sessionDetail.user,
        guestEmail: sessionDetail.guestEmail,
        guestPhone: sessionDetail.guestPhone,
        messageCount: sessionDetail.messageCount,
        sessionType: sessionDetail.user ? 'authenticated' : 'guest',
      },
      messages: sessionDetail.messages.map(msg => ({
        timestamp: new Date(msg.createdAt).toLocaleString(),
        sender: msg.senderType,
        content: msg.content,
        type: msg.messageType,
        status: msg.status,
      })),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-session-${sessionDetail.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateDuration = () => {
    if (!sessionDetail) {
      return 'Unknown';
    }

    const start = new Date(sessionDetail.startedAt);
    const end = sessionDetail.endedAt
      ? new Date(sessionDetail.endedAt)
      : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'bot':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'user':
        return 'text-blue-600 bg-blue-50';
      case 'bot':
        return 'text-green-600 bg-green-50';
      case 'system':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Error loading session
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionDetail) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Session not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested chat session could not be found.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chat Session Details
            </h1>
            <p className="text-gray-600">
              Session ID: {sessionDetail.sessionId}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportChat}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {sessionDetail.status === 'active' && (
            <Button variant="outline" size="sm" onClick={handleEndSession}>
              <Archive className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
          <Badge className={getStatusColor(sessionDetail.status)}>
            {sessionDetail.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat Messages ({sessionDetail.messageCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {sessionDetail.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No messages in this session
                    </p>
                  </div>
                ) : (
                  sessionDetail.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg ${getSenderColor(message.senderType)}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getSenderIcon(message.senderType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm capitalize">
                            {message.senderType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {message.messageType}
                          </Badge>
                        </div>
                        <div className="text-sm">{message.content}</div>
                        {message.metadata &&
                          Object.keys(message.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                              <details>
                                <summary className="cursor-pointer">
                                  Metadata
                                </summary>
                                <pre className="mt-1 text-xs">
                                  {JSON.stringify(message.metadata, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Info */}
        <div className="space-y-6">
          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Session Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getStatusColor(sessionDetail.status)}>
                  {sessionDetail.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="text-sm font-medium">
                  {calculateDuration()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Messages</span>
                <span className="text-sm font-medium">
                  {sessionDetail.messageCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Started</span>
                <span className="text-sm font-medium">
                  {new Date(sessionDetail.startedAt).toLocaleString()}
                </span>
              </div>
              {sessionDetail.endedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ended</span>
                  <span className="text-sm font-medium">
                    {new Date(sessionDetail.endedAt).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Activity</span>
                <span className="text-sm font-medium">
                  {new Date(sessionDetail.lastActivity).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          {sessionDetail.user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Name</span>
                  <p className="font-medium">{sessionDetail.user.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email</span>
                  <p className="font-medium">{sessionDetail.user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">User ID</span>
                  <p className="font-mono text-sm">{sessionDetail.user.id}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guest Contact Information */}
          {(sessionDetail.guestEmail || sessionDetail.guestPhone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Guest Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessionDetail.guestEmail && (
                  <div>
                    <span className="text-sm text-gray-600">Email</span>
                    <p className="font-medium">{sessionDetail.guestEmail}</p>
                  </div>
                )}
                {sessionDetail.guestPhone && (
                  <div>
                    <span className="text-sm text-gray-600">Phone</span>
                    <p className="font-medium">{sessionDetail.guestPhone}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Session Type</span>
                  <Badge variant="outline" className="ml-2">Guest</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionDetail.ipAddress && (
                <div>
                  <span className="text-sm text-gray-600">IP Address</span>
                  <p className="font-mono text-sm">{sessionDetail.ipAddress}</p>
                </div>
              )}
              {sessionDetail.userAgent && (
                <div>
                  <span className="text-sm text-gray-600">User Agent</span>
                  <p className="text-xs text-gray-800 break-all">
                    {sessionDetail.userAgent}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Session ID</span>
                <p className="font-mono text-xs">{sessionDetail.sessionId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {sessionDetail.metadata &&
            Object.keys(sessionDetail.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(sessionDetail.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
