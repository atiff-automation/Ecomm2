// This file configures the initialization of Sentry on the server side
// The config you add here will be used whenever the server handles a request.

import { initSentry } from '@/lib/monitoring/sentry-config';

// Initialize Sentry
initSentry();