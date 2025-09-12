import { NextResponse } from 'next/server';
import { queueProcessor } from '@/lib/chat/queue-processor';

export async function GET() {
  try {
    // Perform comprehensive health check
    const healthCheck = await queueProcessor.performHealthCheck();
    const circuitBreakerStatus = queueProcessor.getCircuitBreakerStatus();

    const response = {
      ...healthCheck,
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date().toISOString(),
      systemVersion: 'v1.0.0'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Health check API error:', error);
    return NextResponse.json(
      {
        isHealthy: false,
        status: 'UNHEALTHY',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === 'reset-circuit-breaker') {
      await queueProcessor.resetCircuitBreaker();
      
      return NextResponse.json({
        success: true,
        message: 'Circuit breaker has been reset',
        circuitBreaker: queueProcessor.getCircuitBreakerStatus()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Health action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform health action' },
      { status: 500 }
    );
  }
}