'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { AdminPageLayout } from '@/components/admin/layout';

export default function ChatConfigPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [position, setPosition] = useState('bottom-right');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [title, setTitle] = useState('Chat Support');
  const [subtitle, setSubtitle] = useState("We're here to help");
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! 👋\nHow can I help you today?');
  const [inputPlaceholder, setInputPlaceholder] = useState('Type your message...');
  const [botAvatarUrl, setBotAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load current config
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/chat-config');
      if (response.ok) {
        const data = await response.json();
        setWebhookUrl(data.webhookUrl || '');
        setIsEnabled(data.isEnabled);
        setPosition(data.position || 'bottom-right');
        setPrimaryColor(data.primaryColor || '#2563eb');
        setTitle(data.title || 'Chat Support');
        setSubtitle(data.subtitle || "We're here to help");
        setWelcomeMessage(data.welcomeMessage || 'Hello! 👋\nHow can I help you today?');
        setInputPlaceholder(data.inputPlaceholder || 'Type your message...');
        setBotAvatarUrl(data.botAvatarUrl || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/admin/chat-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          isEnabled,
          position,
          primaryColor,
          title,
          subtitle,
          welcomeMessage,
          inputPlaceholder,
          botAvatarUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear the chat configuration? This will disable the chat widget.')) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/admin/chat-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: '',
          isEnabled: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to clear configuration');

      setWebhookUrl('');
      setIsEnabled(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error clearing config:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('usage', 'chat_avatar');

      const response = await fetch('/api/admin/site-customization/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload avatar');

      const data = await response.json();
      setBotAvatarUrl(data.mediaUpload.url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = () => {
    if (confirm('Are you sure you want to remove the bot avatar?')) {
      setBotAvatarUrl('');
    }
  };

  return (
    <AdminPageLayout
      title="n8n Chat Configuration"
      subtitle="Configure your n8n chat widget integration"
      loading={loading}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chat Widget Settings</CardTitle>
              <CardDescription>
                Configure the n8n chat webhook URL and enable/disable the widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">n8n Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://your-n8n-instance.com/webhook/xxxxx/chat"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Get this URL from your n8n Chat Trigger node
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isEnabled" className="font-normal cursor-pointer">
                  Enable chat widget on website
                </Label>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </Button>

                  {webhookUrl && (
                    <Button
                      onClick={handleClear}
                      disabled={isSaving}
                      variant="outline"
                      className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear Configuration
                    </Button>
                  )}

                  {saveStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Saved successfully!</span>
                    </div>
                  )}

                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Failed to save</span>
                    </div>
                  )}
                </div>
              </div>

              {saveStatus === 'success' && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-sm text-green-900">
                    <strong>Success!</strong> Configuration updated. Changes take effect immediately on the website.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* UI Customization */}
          <Card>
            <CardHeader>
              <CardTitle>UI Customization</CardTitle>
              <CardDescription>
                Customize the appearance and position of the chat widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Chat Position</Label>
                  <select
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 font-mono text-sm"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Chat Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Chat Support"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Chat Subtitle</Label>
                <Input
                  id="subtitle"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="We're here to help"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <textarea
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hello! 👋&#10;How can I help you today?"
                />
                <p className="text-xs text-muted-foreground">
                  Use \n for line breaks in the welcome message
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inputPlaceholder">Input Placeholder</Label>
                <Input
                  id="inputPlaceholder"
                  type="text"
                  value={inputPlaceholder}
                  onChange={(e) => setInputPlaceholder(e.target.value)}
                  placeholder="Type your message..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Bot Avatar Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Bot Avatar</CardTitle>
              <CardDescription>
                Upload a bot avatar image (recommended: 80×80px, max 2MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Preview */}
              {botAvatarUrl && (
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={botAvatarUrl}
                      alt="Bot Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Avatar</p>
                    <p className="text-xs text-muted-foreground">{botAvatarUrl}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAvatarRemove}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
                <Button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploadingAvatar}
                  variant="outline"
                  size="sm"
                >
                  {isUploadingAvatar ? 'Uploading...' : botAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
                </Button>
                {!botAvatarUrl && (
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, or WebP (max 2MB)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Webhook URL</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded">
                    {webhookUrl || 'Not configured'}
                  </code>
                  {webhookUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-sm mt-1">
                  <span className={`inline-flex items-center gap-1 ${isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Guide */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup Guide</CardTitle>
              <CardDescription>Follow these steps to integrate n8n chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      1
                    </span>
                    Create n8n Workflow
                  </div>
                  <p className="ml-8 text-muted-foreground text-xs">
                    Log in to your n8n instance and create a new workflow
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      2
                    </span>
                    Add Chat Trigger
                  </div>
                  <p className="ml-8 text-muted-foreground text-xs">
                    Add a "Chat Trigger" node to your workflow
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      3
                    </span>
                    Configure CORS
                  </div>
                  <p className="ml-8 text-muted-foreground text-xs mb-2">
                    In Chat Trigger node, add allowed origins:
                  </p>
                  <div className="ml-8 space-y-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                      http://localhost:3000
                    </code>
                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                      https://yourdomain.com
                    </code>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      4
                    </span>
                    Copy Webhook URL
                  </div>
                  <p className="ml-8 text-muted-foreground text-xs">
                    Copy the webhook URL from the Chat Trigger node
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      5
                    </span>
                    Save Configuration
                  </div>
                  <p className="ml-8 text-muted-foreground text-xs">
                    Paste the webhook URL above and click "Save Configuration"
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      6
                    </span>
                    Activate Workflow
                  </div>
                  <p className="ml-8 text-muted-foreground text-xs">
                    Activate your n8n workflow to enable the chat
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open('https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.chattrigger/', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View n8n Docs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-blue-900">
              <p>• Changes take effect immediately without rebuild</p>
              <p>• CORS must be configured in n8n Chat Trigger node</p>
              <p>• The chat widget appears in bottom-right corner</p>
              <p>• All chat data is stored in n8n execution logs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  );
}
