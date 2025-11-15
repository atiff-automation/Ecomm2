/**
 * SecuritySection Component - Collapsible security settings with accordion
 * Following @CLAUDE.md principles - reusable, type-safe, DRY
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SecuritySectionProps } from '@/types/member';
import { Lock } from 'lucide-react';
import { ICON_SIZES } from '@/lib/constants/layout';
import { MEMBER_PAGE_TEXT } from '@/lib/constants/member-text';

export function SecuritySection({
  items,
  defaultOpenItem,
}: SecuritySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className={ICON_SIZES.REGULAR} />
          {MEMBER_PAGE_TEXT.SECTIONS.SECURITY.TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          defaultValue={defaultOpenItem}
          className="w-full"
        >
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <item.icon className={ICON_SIZES.REGULAR} />
                  <div className="text-left">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-600 font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
