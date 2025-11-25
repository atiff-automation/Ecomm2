/**
 * Create Click Page Page
 */

import { Metadata } from 'next';
import { ClickPageEditor } from '../_components/ClickPageEditor';

export const metadata: Metadata = {
  title: 'Create Click Page | Admin',
  description: 'Create a new promotional click page',
};

export default function CreateClickPage() {
  return <ClickPageEditor mode="create" />;
}
