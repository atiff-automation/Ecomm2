/**
 * WebSocket Configuration Setup Script
 * Initializes database with WebSocket settings and creates necessary triggers
 * Following @CLAUDE.md principles: systematic, centralized, no hardcoded values
 */

import { prisma } from '../src/lib/db/prisma';
import { DATABASE_TRIGGERS } from '../src/lib/websocket/events';

async function setupWebSocketConfiguration() {
  console.log('🔧 Setting up WebSocket configuration...');

  try {
    // Initialize WebSocket configuration in system_config table
    const websocketConfig = {
      websocketPort: 3001,
      heartbeatMs: 30000,
      maxReconnectAttempts: 5,
      connectionTimeoutMs: 10000,
      enableCompression: true,
      allowedOrigins: ['http://localhost:3000'],
    };

    console.log('📝 Creating WebSocket configuration entry...');

    await prisma.systemConfig.upsert({
      where: { key: 'websocket_settings' },
      create: {
        key: 'websocket_settings',
        value: JSON.stringify(websocketConfig),
        type: 'json',
      },
      update: {
        value: JSON.stringify(websocketConfig),
        type: 'json',
      },
    });

    console.log('✅ WebSocket configuration created/updated');

    // Setup database triggers for real-time events
    console.log('🗄️ Setting up database triggers...');

    // Split the trigger creation into separate commands
    console.log('Creating chat_session_change function...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION notify_chat_session_change()
      RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify('chat_session_change',
          json_build_object(
            'action', TG_OP,
            'session_id', COALESCE(NEW.session_id, OLD.session_id),
            'status', COALESCE(NEW.status, OLD.status),
            'user_id', COALESCE(NEW.user_id, OLD.user_id),
            'timestamp', EXTRACT(EPOCH FROM NOW())::bigint
          )::text
        );
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Dropping existing chat_session trigger...');
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS chat_session_notify ON chat_sessions;`);

    console.log('Creating chat_session trigger...');
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER chat_session_notify
        AFTER INSERT OR UPDATE OR DELETE ON chat_sessions
        FOR EACH ROW EXECUTE FUNCTION notify_chat_session_change();
    `);

    console.log('Creating chat_message_change function...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION notify_chat_message_change()
      RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify('chat_message_change',
          json_build_object(
            'action', TG_OP,
            'message_id', COALESCE(NEW.id, OLD.id),
            'session_id', COALESCE(NEW.session_id, OLD.session_id),
            'timestamp', EXTRACT(EPOCH FROM NOW())::bigint
          )::text
        );
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Dropping existing chat_message trigger...');
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS chat_message_notify ON chat_messages;`);

    console.log('Creating chat_message trigger...');
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER chat_message_notify
        AFTER INSERT OR UPDATE OR DELETE ON chat_messages
        FOR EACH ROW EXECUTE FUNCTION notify_chat_message_change();
    `);

    console.log('✅ Database triggers created successfully');

    // Verify the configuration
    console.log('🔍 Verifying configuration...');
    const configRecord = await prisma.systemConfig.findFirst({
      where: { key: 'websocket_settings' },
    });

    if (configRecord) {
      const config = JSON.parse(configRecord.value);
      console.log('✅ Configuration verified:', {
        port: config.websocketPort,
        heartbeat: config.heartbeatMs,
        maxReconnects: config.maxReconnectAttempts,
      });
    }

    console.log('🎉 WebSocket setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up WebSocket configuration:', error);
    throw error;
  }
}

async function main() {
  try {
    await setupWebSocketConfiguration();
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if script is executed directly
if (require.main === module) {
  main();
}

export { setupWebSocketConfiguration };