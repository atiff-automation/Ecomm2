'use client';

import { useState } from 'react';
import TipTapEditor from '@/components/admin/TipTapEditor';

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>Test content - try formatting this text!</p>');

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">TipTap Editor Test</h1>
      <p className="text-gray-600 mb-6">
        Test all formatting features: bold, italic, headings, lists, links, etc.
      </p>

      <TipTapEditor content={content} onChange={setContent} />

      <div className="mt-8">
        <h2 className="font-bold text-lg mb-2">HTML Output:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {content}
        </pre>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Test Checklist:</h2>
        <ul className="space-y-1 text-sm">
          <li>✓ Editor renders without errors</li>
          <li>✓ Toolbar buttons appear</li>
          <li>✓ Can type and format text</li>
          <li>✓ Bold, italic, underline work</li>
          <li>✓ Headings (H1, H2, H3) work</li>
          <li>✓ Lists (bullet, numbered) work</li>
          <li>✓ Text alignment works</li>
          <li>✓ Can add links</li>
          <li>✓ HTML output updates in real-time</li>
          <li>✓ Can paste emojis 😊 🎉 ✨</li>
        </ul>
      </div>
    </div>
  );
}
