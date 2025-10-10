'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, FileText, File, Code, Printer } from 'lucide-react';
import { ExportOptions } from '@/lib/services/export';

const formatIcons = {
  markdown: FileText,
  pdf: Printer,
  html: File,
  json: Code,
};

const formatLabels = {
  markdown: 'Markdown',
  pdf: 'PDF',
  html: 'HTML',
  json: 'JSON',
};

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = parseInt(params.id as string);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    campaignId,
    format: 'markdown',
    sections: {
      timeline: true,
      sessions: true,
      characters: true,
      locations: true,
      quests: true,
      magicItems: false,
    },
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleSectionChange = (section: keyof ExportOptions['sections'], checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: checked,
      },
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportOptions),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `campaign-export.${exportOptions.format}`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const sections = [
    { key: 'timeline' as const, label: 'Timeline Events', description: 'Campaign timeline and major events' },
    { key: 'sessions' as const, label: 'Sessions', description: 'Session summaries and logs' },
    { key: 'characters' as const, label: 'Characters', description: 'Player characters and NPCs' },
    { key: 'locations' as const, label: 'Locations', description: 'Campaign locations and maps' },
    { key: 'quests' as const, label: 'Quests', description: 'Active and completed quests' },
    { key: 'magicItems' as const, label: 'Magic Items', description: 'All magic items in the campaign' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Export Campaign</h1>
        <p className="text-base-content/70">
          Export your campaign data in various formats for backup, sharing, or printing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select
                name="format"
                value={exportOptions.format}
                onValueChange={(value) =>
                  setExportOptions(prev => ({ ...prev, format: value as ExportOptions['format'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formatLabels).map(([format, label]) => {
                    const Icon = formatIcons[format as keyof typeof formatIcons];
                    return (
                      <SelectItem key={format} value={format}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-base-content/70 mt-1">
                {exportOptions.format === 'markdown' && 'Plain text format, great for version control and editing'}
                {exportOptions.format === 'pdf' && 'Professional PDF document, perfect for printing and sharing'}
                {exportOptions.format === 'html' && 'Web page format, viewable in any browser'}
                {exportOptions.format === 'json' && 'Raw data format, useful for importing into other tools'}
              </p>
            </div>

            <div>
              <Label>Date Range (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={exportOptions.dateRange?.start || ''}
                    onChange={(e) =>
                      setExportOptions(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange!,
                          start: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={exportOptions.dateRange?.end || ''}
                    onChange={(e) =>
                      setExportOptions(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange!,
                          end: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-base-content/70 mt-1">
                Leave empty to export all data
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sections to Include */}
        <Card>
          <CardHeader>
            <CardTitle>Content Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={section.key}
                    checked={exportOptions.sections[section.key] || false}
                    onChange={(e) => handleSectionChange(section.key, e.target.checked)}
                    className="checkbox checkbox-sm mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={section.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.label}
                    </Label>
                    <p className="text-xs text-base-content/70">
                      {section.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Format</h4>
              <div className="flex items-center gap-2">
                {React.createElement(formatIcons[exportOptions.format], { className: "w-4 h-4" })}
                <span>{formatLabels[exportOptions.format]}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Sections Included</h4>
              <div className="flex flex-wrap gap-1">
                {sections
                  .filter(section => exportOptions.sections[section.key])
                  .map(section => (
                    <span key={section.key} className="badge badge-outline badge-sm">
                      {section.label}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || !Object.values(exportOptions.sections).some(Boolean)}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Campaign'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}