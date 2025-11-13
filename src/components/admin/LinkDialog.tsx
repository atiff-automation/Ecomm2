/**
 * Link Dialog Component
 * Modern dialog for adding/editing links in TipTap editor
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon } from 'lucide-react';

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
  isEditing?: boolean;
}

export default function LinkDialog({
  open,
  onClose,
  onSave,
  initialUrl = '',
  initialText = '',
  isEditing = false,
}: LinkDialogProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setText(initialText);
    }
  }, [open, initialUrl, initialText]);

  const handleSave = () => {
    // Validation
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }

    // For new links (not editing), text is required
    if (!isEditing && !text.trim()) {
      alert('Please enter link text');
      return;
    }

    onSave(url.trim(), text.trim() || undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {isEditing ? 'Edit Link' : 'Insert Link'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the link URL'
              : 'Add a hyperlink to your content'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Link Text - only show for new links */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="link-text">
                Link Text <span className="text-red-500">*</span>
              </Label>
              <Input
                id="link-text"
                placeholder="Click here"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                The text that will be displayed
              </p>
            </div>
          )}

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="link-url">
              URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="link-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus={isEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter a full URL including https://
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {isEditing ? 'Update Link' : 'Insert Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
