import { SessionLog } from "@/lib/db/schema";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionLogListProps {
  logs: SessionLog[];
}

export function SessionLogList({ logs }: SessionLogListProps) {
  const getEntryTypeIcon = (entryType: string) => {
    switch (entryType) {
      case 'narrative': return '📖';
      case 'combat': return '⚔️';
      case 'roleplay': return '🎭';
      case 'exploration': return '🗺️';
      case 'rest': return '💤';
      case 'summary': return '📋';
      default: return '📝';
    }
  };

  const getEntryTypeColor = (entryType: string) => {
    switch (entryType) {
      case 'combat': return 'border-red-200 bg-red-50';
      case 'roleplay': return 'border-purple-200 bg-purple-50';
      case 'exploration': return 'border-green-200 bg-green-50';
      case 'rest': return 'border-blue-200 bg-blue-50';
      case 'summary': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-base-300 bg-base-200';
    }
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent>
          <CardTitle>Session Logs</CardTitle>
          <p className="text-base-content/70 text-center py-8">
            No logs yet. Start recording your session events!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <CardTitle>Session Logs ({logs.length})</CardTitle>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 border-l-4 rounded-r-lg ${getEntryTypeColor(log.entryType)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getEntryTypeIcon(log.entryType)}</span>
                  <span className="font-medium capitalize">{log.entryType}</span>
                  {log.timestamp && (
                    <span className="text-sm text-base-content/70">• {log.timestamp}</span>
                  )}
                </div>

                <div className="text-xs text-base-content/70">
                  {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="mb-2">{log.content}</p>
              </div>

              {log.tags && Array.isArray(log.tags) && log.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {log.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {String(tag)}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {log.isSummary ? (
                <div className="mt-2">
                  <Badge>Session Summary</Badge>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}