'use client';

/**
 * Click Page Editor Component
 * Main drag-and-drop page builder interface
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, Save, Eye, Settings, Layers } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  containerPaddingToStyle,
  migrateContainerPadding,
  calculateResponsivePadding,
} from '@/lib/utils/click-page-padding';
import type { Block, BlockType, ClickPageStatus } from '@/types/click-page.types';
import type { ThemeSettings } from '@/types/click-page-styles.types';
import { createDefaultBlock, reorderBlocks } from '@/lib/utils/block-registry';
import { generateClickPageSlug } from '@/lib/constants/click-page-constants';
import { DEFAULT_DEVICE_MODE, DEVICE_DEFAULT_ZOOM, type DeviceMode } from '@/lib/constants/editor-constants';
import { BlockPalette } from './BlockPalette';
import { EditableBlockWrapper } from './EditableBlockWrapper';
import { DevicePreview, DevicePreviewToolbar } from './DevicePreview';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import { GlobalThemeSettings } from '@/components/admin/click-pages/GlobalThemeSettings';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';

interface ClickPageEditorProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    slug: string;
    blocks: Block[];
    status: ClickPageStatus;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImageUrl?: string;
    fbPixelId?: string;
    gaTrackingId?: string;
    gtmContainerId?: string;
    scheduledPublishAt?: Date | null;
    scheduledUnpublishAt?: Date | null;
    campaignName?: string;
    themeSettings?: ThemeSettings;
  };
}

/**
 * Default theme settings
 */
const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    monospace: 'Fira Code',
  },
  defaultSpacing: {
    blockGap: 32,
    containerPadding: {
      linked: true,
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
    },
  },
};

export function ClickPageEditor({ mode, initialData }: ClickPageEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [status, setStatus] = useState<ClickPageStatus>(initialData?.status || 'DRAFT');
  const [blocks, setBlocks] = useState<Block[]>(initialData?.blocks || []);

  // SEO state
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  const [ogImageUrl, setOgImageUrl] = useState(initialData?.ogImageUrl || '');
  const [fbPixelId, setFbPixelId] = useState(initialData?.fbPixelId || '');
  const [gaTrackingId, setGaTrackingId] = useState(initialData?.gaTrackingId || '');

  // Campaign state
  const [campaignName, setCampaignName] = useState(initialData?.campaignName || '');

  // Theme state
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(
    initialData?.themeSettings || DEFAULT_THEME_SETTINGS
  );

  // UI state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Device preview state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(DEFAULT_DEVICE_MODE);
  const [zoomLevel, setZoomLevel] = useState<number>(DEVICE_DEFAULT_ZOOM[DEFAULT_DEVICE_MODE]);

  /**
   * Handle device mode change with automatic zoom adjustment
   */
  const handleDeviceModeChange = useCallback((mode: DeviceMode) => {
    setDeviceMode(mode);
    setZoomLevel(DEVICE_DEFAULT_ZOOM[mode]);
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get selected block
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Memoize block IDs for sortable context (performance optimization)
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  // Calculate responsive container padding based on device mode
  // Auto-scales padding for tablet and mobile following industry best practices
  const containerPaddingStyle = useMemo(() => {
    if (!themeSettings.defaultSpacing?.containerPadding) {
      console.log('[ClickPageEditor] No containerPadding in theme settings, using default');
      return containerPaddingToStyle(migrateContainerPadding(undefined));
    }

    console.log('[ClickPageEditor] Raw containerPadding from themeSettings:', themeSettings.defaultSpacing.containerPadding);

    // Migrate old format to new format for backward compatibility
    const paddingConfig = migrateContainerPadding(themeSettings.defaultSpacing.containerPadding);
    console.log('[ClickPageEditor] After migration, paddingConfig:', paddingConfig);
    console.log('[ClickPageEditor] Current deviceMode:', deviceMode);

    // For editor: Calculate padding based on device mode (not media queries)
    // Media queries don't work in fixed-width containers
    if (deviceMode === 'mobile') {
      const mobilePadding = {
        linked: paddingConfig.linked,
        top: calculateResponsivePadding(paddingConfig.top, 'mobile'),
        right: calculateResponsivePadding(paddingConfig.right, 'mobile'),
        bottom: calculateResponsivePadding(paddingConfig.bottom, 'mobile'),
        left: calculateResponsivePadding(paddingConfig.left, 'mobile'),
      };
      console.log('[ClickPageEditor] MOBILE padding:', mobilePadding);
      return containerPaddingToStyle(mobilePadding);
    } else if (deviceMode === 'tablet') {
      const tabletPadding = {
        linked: paddingConfig.linked,
        top: calculateResponsivePadding(paddingConfig.top, 'tablet'),
        right: calculateResponsivePadding(paddingConfig.right, 'tablet'),
        bottom: calculateResponsivePadding(paddingConfig.bottom, 'tablet'),
        left: calculateResponsivePadding(paddingConfig.left, 'tablet'),
      };
      console.log('[ClickPageEditor] TABLET padding:', tabletPadding);
      return containerPaddingToStyle(tabletPadding);
    } else {
      // Desktop: Use original values
      console.log('[ClickPageEditor] DESKTOP padding (original):', paddingConfig);
      return containerPaddingToStyle(paddingConfig);
    }
  }, [themeSettings, deviceMode]);

  // Handle title change and auto-generate slug
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Always auto-generate slug from title in create mode
    if (mode === 'create') {
      setSlug(generateClickPageSlug(value));
    }
  };

  // Add new block
  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock = createDefaultBlock(type, blocks.length);
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast.success(`${type} block added`);
  }, [blocks.length]);

  // Remove block
  const handleRemoveBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    toast.success('Block removed');
  }, [selectedBlockId]);

  // Duplicate block
  const handleDuplicateBlock = useCallback((blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const newBlock = {
      ...block,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sortOrder: blocks.length,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast.success('Block duplicated');
  }, [blocks]);

  // Update block settings
  const handleUpdateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? ({ ...b, ...updates } as Block) : b))
    );
  }, []);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      setBlocks(reorderBlocks(blocks, oldIndex, newIndex));
    }
  };

  // Save click page
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!slug.trim()) {
      toast.error('Please enter a slug');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        slug,
        blocks,
        status,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        ogImageUrl: ogImageUrl || undefined,
        fbPixelId: fbPixelId || undefined,
        gaTrackingId: gaTrackingId || undefined,
        campaignName: campaignName || undefined,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
        themeSettings,
      };

      const url = mode === 'create'
        ? '/api/admin/click-pages'
        : `/api/admin/click-pages/${initialData?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      const data = await response.json();
      toast.success(mode === 'create' ? 'Click page created!' : 'Click page saved!');

      if (mode === 'create') {
        router.push(`/admin/click-pages/${data.clickPage.id}/edit`);
      }
    } catch (error) {
      console.error('Error saving click page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save click page');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview click page
  const handlePreview = () => {
    if (slug) {
      window.open(`/click/${slug}`, '_blank');
    } else {
      toast.error('Please enter a slug first');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/admin/click-pages">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Click Page Title"
                className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0"
              />
              <div className="text-sm text-gray-500">/click/{slug || 'your-slug'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as ClickPageStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            {mode === 'edit' && status === 'PUBLISHED' && (
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - CSS Grid Layout with Fixed Sidebars */}
      <div className="grid grid-cols-[256px_1fr_320px] max-w-screen-2xl mx-auto">
        {/* Left Sidebar - Block Palette (Fixed Width) */}
        <aside className="bg-white border-r p-4 h-[calc(100vh-60px)] sticky top-[60px] overflow-y-auto">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Blocks
          </h3>
          <BlockPalette onAddBlock={handleAddBlock} />
        </aside>

        {/* Center - Canvas (Flexible, Scrollable) */}
        <main className="flex flex-col min-w-0 h-[calc(100vh-60px)]">
          {/* Device Preview Toolbar - Fixed at top */}
          <DevicePreviewToolbar
            mode={deviceMode}
            zoom={zoomLevel}
            onModeChange={handleDeviceModeChange}
            onZoomChange={setZoomLevel}
          />

          {/* Canvas with Device Preview */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blockIds}
              strategy={verticalListSortingStrategy}
            >
              <DevicePreview mode={deviceMode} zoom={zoomLevel} onZoomChange={setZoomLevel}>
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <Layers className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">No blocks yet</p>
                    <p className="text-sm">Add blocks from the left sidebar</p>
                  </div>
                ) : (
                  <div
                    className="flex flex-col"
                    style={{
                      gap: `${themeSettings.defaultSpacing?.blockGap ?? 32}px`,
                      ...containerPaddingStyle,
                    }}
                  >
                    {[...blocks]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((block) => (
                        <EditableBlockWrapper
                          key={block.id}
                          block={block}
                          isSelected={selectedBlockId === block.id}
                          themeSettings={themeSettings}
                          onSelect={() => setSelectedBlockId(block.id)}
                          onRemove={() => handleRemoveBlock(block.id)}
                          onDuplicate={() => handleDuplicateBlock(block.id)}
                          onBlockClick={(blockId, blockType, targetUrl) => {
                            console.log('Block clicked:', { blockId, blockType, targetUrl });
                          }}
                        />
                      ))}
                  </div>
                )}
              </DevicePreview>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 opacity-80">
                  {blocks.find((b) => b.id === activeId)?.type.replace(/_/g, ' ')}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        {/* Right Sidebar - Settings (Fixed Width) */}
        <aside className="bg-white border-l h-[calc(100vh-60px)] sticky top-[60px] overflow-y-auto">
          <Tabs defaultValue="block" className="h-full">
            <TabsList className="w-full justify-start border-b rounded-none px-4">
              <TabsTrigger value="block" className="flex items-center gap-1">
                <Layers className="w-4 h-4" />
                Block
              </TabsTrigger>
              <TabsTrigger value="page" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                Page
              </TabsTrigger>
            </TabsList>
            <TabsContent value="block" className="p-4 m-0">
              {selectedBlock ? (
                <BlockSettingsPanel
                  block={selectedBlock}
                  onUpdate={(updates) => handleUpdateBlock(selectedBlock.id, updates)}
                />
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <Settings className="w-8 h-8 mx-auto mb-2" />
                  <p>Select a block to edit</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="page" className="p-4 m-0 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
              {/* Theme Settings */}
              <GlobalThemeSettings
                value={themeSettings}
                onChange={setThemeSettings}
              />

              {/* Divider */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-sm mb-4">Page Settings</h3>
              </div>

              <div>
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="page-slug"
                  disabled={mode === 'create'}
                  className={mode === 'create' ? 'cursor-not-allowed opacity-70' : ''}
                />
                {mode === 'create' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated from title
                  </p>
                )}
              </div>
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO Title"
                />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Input
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO Description"
                />
              </div>
              <div>
                <Label>OG Image (Social Media Preview)</Label>
                <ImageUpload
                  value={ogImageUrl ? [{ url: ogImageUrl }] : []}
                  onChange={(images: UploadedImage[]) => {
                    const url = images[0]?.url || '';
                    setOgImageUrl(url);
                  }}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  accept="image/*"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 1200x630px for optimal social media display
                </p>
              </div>
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Summer Sale 2025"
                />
              </div>
              <div>
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={fbPixelId}
                  onChange={(e) => setFbPixelId(e.target.value)}
                  placeholder="Pixel ID"
                />
              </div>
              <div>
                <Label>Google Analytics ID</Label>
                <Input
                  value={gaTrackingId}
                  onChange={(e) => setGaTrackingId(e.target.value)}
                  placeholder="GA-XXXXXXX"
                />
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
