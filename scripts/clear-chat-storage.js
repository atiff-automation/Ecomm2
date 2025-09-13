#!/usr/bin/env node

/**
 * Clear Chat Storage - Debug Utility
 * 
 * This script helps clear stale localStorage data for the chat system
 * Run this when the frontend is stuck with invalid session IDs
 */

console.log('🧹 Chat Storage Clear Utility');
console.log('===============================');
console.log('');
console.log('To clear the chat localStorage data:');
console.log('');
console.log('1. Open your browser Developer Tools (F12)');
console.log('2. Go to the Console tab');
console.log('3. Paste and run the following command:');
console.log('');
console.log('// Clear all chat-related localStorage');
console.log('Object.keys(localStorage)');
console.log('  .filter(key => key.startsWith("chat_"))');
console.log('  .forEach(key => {');
console.log('    console.log("Removing:", key);');
console.log('    localStorage.removeItem(key);');
console.log('  });');
console.log('console.log("✅ Chat storage cleared! Refresh the page.");');
console.log('');
console.log('4. Refresh the page after running the command');
console.log('');
console.log('This will remove all stale session data and force the chat to start fresh.');