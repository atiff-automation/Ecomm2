'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Download,
  Upload,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  Archive,
  FileDown,
  FileUp,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { TemplateManager } from './TemplateManager';
import { BackupManager } from './BackupManager';

interface ImportSummary {
  imported: boolean;
  timestamp: string;
  importedBy: string;
  configuration: {
    botUsername?: string;
    botName?: string;
    ordersEnabled: boolean;
    inventoryEnabled: boolean;
    hasSecrets: boolean;
    channelsConfigured: string[];
  };
  metadata: {
    originalExportDate?: string;
    originalExporter?: string;
    version?: string;
    configurationHash?: string;
  };
}

export function ImportExportManager() {
  const [activeTab, setActiveTab] = useState<'import-export' | 'templates' | 'backups'>('import-export');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml'>('json');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportConfiguration = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        secrets: includeSecrets.toString(),
        format: exportFormat
      });

      const response = await fetch(`/api/admin/telegram/export?${params}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `telegram-config-${Date.now()}.${exportFormat}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Configuration exported as ${filename}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Export failed');
      }
    } catch (error) {
      toast.error('Export failed unexpectedly');
    } finally {
      setExporting(false);
    }
  };

  const importConfiguration = async (file: File) => {
    setImporting(true);
    setImportSummary(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/telegram/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setImportSummary(result.summary);
        toast.success('Configuration imported successfully');
      } else {
        toast.error(result.error || 'Import failed');
        if (result.details) {
          console.error('Import details:', result.details);
        }
      }
    } catch (error) {
      toast.error('Import failed unexpectedly');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = ['.json', '.yml', '.yaml'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Please select a valid configuration file (.json, .yml, .yaml)');
        return;
      }

      if (file.size > 1024 * 1024) { // 1MB limit
        toast.error('File size must be less than 1MB');
        return;
      }

      importConfiguration(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('import-export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import-export'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Import/Export
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'backups'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Backups
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'templates' ? (
        <TemplateManager />
      ) : activeTab === 'backups' ? (
        <BackupManager />
      ) : (
        <div className="space-y-6">
          {/* Export Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2 text-blue-500" />
                Export Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Download your Telegram notification configuration as a backup or to share with other environments.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Export Format</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={exportFormat === 'json' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFormat('json')}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                    <Button
                      variant={exportFormat === 'yaml' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFormat('yaml')}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      YAML
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Security Options</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-secrets"
                      checked={includeSecrets}
                      onCheckedChange={setIncludeSecrets}
                    />
                    <Label htmlFor="include-secrets" className="text-sm">
                      Include bot token
                    </Label>
                    <Shield className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
              </div>

              {includeSecrets && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Warning:</strong> The exported file will contain your bot token. 
                    Keep it secure and do not share it publicly. Consider using this option only for 
                    secure backups or trusted environment transfers.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={exportConfiguration}
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Import Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-green-500" />
                Import Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload a previously exported configuration file to restore your Telegram notification settings.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yml,.yaml"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={importing}
                />
                
                {importing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Importing configuration...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileUp className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Click to select configuration file</p>
                    <p className="text-xs text-muted-foreground">
                      Supports JSON and YAML formats (max 1MB)
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      Select File
                    </Button>
                  </div>
                )}
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import Behavior:</strong> Importing will replace your current configuration. 
                  Make sure to export your current settings first if you want to preserve them.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Import Summary */}
          {importSummary && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Import Successful
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">Configuration Details</h4>
                    <div className="space-y-1 text-sm">
                      {importSummary.configuration.botUsername && (
                        <div className="flex items-center space-x-2">
                          <span>Bot:</span>
                          <Badge variant="outline">@{importSummary.configuration.botUsername}</Badge>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span>Orders:</span>
                        <Badge variant={importSummary.configuration.ordersEnabled ? 'default' : 'secondary'}>
                          {importSummary.configuration.ordersEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Inventory:</span>
                        <Badge variant={importSummary.configuration.inventoryEnabled ? 'default' : 'secondary'}>
                          {importSummary.configuration.inventoryEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {importSummary.configuration.hasSecrets && (
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-700">Bot token included</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">Import Metadata</h4>
                    <div className="space-y-1 text-xs text-green-700">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Imported: {new Date(importSummary.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>By: {importSummary.importedBy}</span>
                      </div>
                      {importSummary.metadata.originalExportDate && (
                        <div className="flex items-center space-x-1">
                          <Archive className="w-3 h-3" />
                          <span>Originally exported: {new Date(importSummary.metadata.originalExportDate).toLocaleString()}</span>
                        </div>
                      )}
                      {importSummary.metadata.configurationHash && (
                        <div className="flex items-center space-x-1">
                          <Hash className="w-3 h-3" />
                          <span>Hash: {importSummary.metadata.configurationHash}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}