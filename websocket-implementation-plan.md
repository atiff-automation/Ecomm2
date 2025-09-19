# WebSocket Implementation Plan for Chat Management

## Current State Analysis
- **Current**: 30-second polling with setInterval
- **Problem**: Delayed updates, inefficient requests
- **Goal**: Real-time instant updates when sessions change

## WebSocket Architecture Design

### Option 1: Next.js API Route + ws Library
```typescript
// pages/api/chat/websocket.ts
import { Server } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket.server.io) {
    res.end()
    return
  }

  const io = new Server(res.socket.server)
  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('Admin connected:', socket.id)

    socket.on('subscribe-admin', () => {
      socket.join('admin-chat-updates')
    })

    socket.on('disconnect', () => {
      console.log('Admin disconnected:', socket.id)
    })
  })

  res.end()
}
```

### Option 2: Standalone WebSocket Server (Recommended)
```typescript
// lib/websocket/chat-server.ts
import { WebSocketServer } from 'ws'
import { createServer } from 'http'

class ChatWebSocketServer {
  private wss: WebSocketServer
  private clients: Set<WebSocket> = new Set()

  constructor(port: number = 3001) {
    const server = createServer()
    this.wss = new WebSocketServer({ server })

    this.wss.on('connection', (ws) => {
      this.clients.add(ws)

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString())
        this.handleMessage(ws, message)
      })

      ws.on('close', () => {
        this.clients.delete(ws)
      })
    })

    server.listen(port)
  }

  // Broadcast session updates to all admin clients
  broadcastSessionUpdate(sessionData: any) {
    const message = JSON.stringify({
      type: 'session_update',
      data: sessionData,
      timestamp: new Date().toISOString()
    })

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }
}
```

### Option 3: Socket.IO (Most Feature-Rich)
```typescript
// lib/websocket/socket-server.ts
import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  socket.on('join-admin-room', () => {
    socket.join('admin-chat-management')
  })
})

// Function to emit session updates
export const emitSessionUpdate = (sessionData: any) => {
  io.to('admin-chat-management').emit('session-updated', sessionData)
}

httpServer.listen(3001)
```

## Frontend WebSocket Integration

### React Hook for WebSocket
```typescript
// hooks/useChatWebSocket.ts
import { useEffect, useRef, useState } from 'react'

interface UseChatWebSocketProps {
  onSessionUpdate: (sessions: ChatSession[]) => void
  onMetricsUpdate: (metrics: ChatMetrics) => void
}

export const useChatWebSocket = ({
  onSessionUpdate,
  onMetricsUpdate
}: UseChatWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket('ws://localhost:3001')

      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log('✅ WebSocket connected')

        // Subscribe to admin updates
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          channel: 'admin-chat-updates'
        }))
      }

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case 'session_update':
            onSessionUpdate(message.data.sessions)
            break
          case 'metrics_update':
            onMetricsUpdate(message.data.metrics)
            break
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        console.log('🔌 WebSocket disconnected, attempting reconnect...')

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }, [onSessionUpdate, onMetricsUpdate])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { isConnected }
}
```

### Integration in Chat Management Page
```typescript
// In src/app/admin/chat/page.tsx
const { isConnected } = useChatWebSocket({
  onSessionUpdate: (newSessions) => {
    setSessions(newSessions)
    setLoading(false)
  },
  onMetricsUpdate: (newMetrics) => {
    setMetrics(newMetrics)
  }
})

// Remove the polling useEffect entirely
// No more setInterval needed!
```

## Database Event Triggers

### PostgreSQL NOTIFY/LISTEN
```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION notify_session_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('chat_session_change',
    json_build_object(
      'action', TG_OP,
      'session_id', COALESCE(NEW.session_id, OLD.session_id),
      'status', COALESCE(NEW.status, OLD.status)
    )::text
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER chat_session_notify
  AFTER INSERT OR UPDATE OR DELETE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION notify_session_change();
```

### Prisma Event Listener
```typescript
// lib/database/session-listener.ts
import { Client } from 'pg'
import { emitSessionUpdate } from '../websocket/socket-server'

const client = new Client(process.env.DATABASE_URL)

client.connect()
client.query('LISTEN chat_session_change')

client.on('notification', async (msg) => {
  const payload = JSON.parse(msg.payload!)

  // Fetch updated data and broadcast
  const updatedSessions = await fetchAllSessions()
  const updatedMetrics = await calculateMetrics()

  emitSessionUpdate({
    sessions: updatedSessions,
    metrics: updatedMetrics
  })
})
```

## Benefits of WebSocket Approach

1. **Instant Updates**: < 100ms vs 30-second delay
2. **Efficient**: Only sends data when changes occur
3. **Real-time Status**: See session status changes instantly
4. **Live Metrics**: Metrics update in real-time
5. **Multiple Admins**: All admin users see updates simultaneously
6. **Bidirectional**: Can send commands (end session, archive, etc.)

## Implementation Phases

### Phase 1: Basic WebSocket (1-2 hours)
- Setup WebSocket server
- Connect frontend
- Basic session updates

### Phase 2: Database Integration (2-3 hours)
- PostgreSQL NOTIFY/LISTEN
- Trigger-based updates
- Event-driven architecture

### Phase 3: Advanced Features (3-4 hours)
- Connection status indicators
- Reconnection handling
- Real-time commands (end session)
- Multi-admin synchronization

## When to Use WebSocket vs Polling

### Use WebSocket When:
- ✅ Need instant updates (< 1 second)
- ✅ High-frequency changes expected
- ✅ Multiple users need sync
- ✅ Bidirectional communication needed

### Use Polling When:
- ✅ Simple implementation preferred
- ✅ Infrequent updates (> 30 seconds)
- ✅ One-way communication sufficient
- ✅ Quick prototype/MVP