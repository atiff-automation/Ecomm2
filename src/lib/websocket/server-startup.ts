/**
 * WebSocket Server Startup Script
 * Initializes and starts the WebSocket server for real-time chat functionality
 */

import { createServer } from 'http';
import { webSocketManager } from './server';

/**
 * Start the WebSocket server
 */
export async function startWebSocketServer(): Promise<void> {
  try {
    // Create HTTP server for WebSocket
    const httpServer = createServer();
    
    // Initialize WebSocket server
    webSocketManager.initialize(httpServer);
    
    // Get port from environment or use default
    const port = parseInt(process.env.WEBSOCKET_PORT || '3001');
    
    // Start listening
    httpServer.listen(port, () => {
      console.log(`🚀 WebSocket server started on port ${port}`);
      console.log(`🔌 WebSocket endpoint: ws://localhost:${port}`);
    });
    
    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('📴 Shutting down WebSocket server...');
      await webSocketManager.shutdown();
      httpServer.close(() => {
        console.log('✅ WebSocket server shutdown complete');
        process.exit(0);
      });
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('❌ Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

/**
 * Start server if this script is run directly
 */
if (require.main === module) {
  startWebSocketServer();
}