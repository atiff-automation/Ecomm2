#!/usr/bin/env python3
"""
Script to update admin route authorization patterns
Replaces old manual role checks with requireAdminRole() helper
"""

import re
import os

files_to_update = [
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/customers/[customerId]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/discount-codes/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/discount-codes/[id]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/payments/gateways/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/payments/stats/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/products/metrics/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/products/bulk/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/products/[id]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/member-promotions/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/discounts/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/shipping/config/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/agent-applications/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/agent-applications/[id]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/dashboard/stats/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/dashboard/analytics/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/orders/fulfillment/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/orders/bulk-update/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/orders/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/orders/[id]/airway-bill/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/orders/[id]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/membership/pending/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/reports/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/reports/analytics/route.ts",
]

# Pattern to match old authorization code
old_auth_pattern = re.compile(
    r'const session = await getServerSession\(authOptions\);\s*\n\s*\n\s*if \(\s*\n\s*!session\?\. user \|\|\s*\n\s*\(session\.user\.role !== UserRole\.ADMIN &&\s*\n\s*session\.user\.role !== UserRole\.STAFF\)\s*\n\s*\) \{\s*\n\s*return NextResponse\.json\(\s*\n\s*\{ (?:message|error): [\'"](?:Unauthorized|Unauthorized\. Admin access required\.)[\'"] \},\s*\n\s*\{ status: (?:401|403) \}\s*\n\s*\);\s*\n\s*\}',
    re.MULTILINE
)

new_auth_code = """// Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;"""

def update_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        original_content = content

        # Step 1: Add requireAdminRole import if not present
        if 'requireAdminRole' not in content:
            # Remove old imports
            content = re.sub(r"import \{ getServerSession \} from 'next-auth';\n", '', content)
            content = re.sub(r"import \{ authOptions \} from '@/lib/auth/config';\n", '', content)

            # Add new import after NextRequest/NextResponse import
            content = re.sub(
                r"(import \{ (?:NextRequest, NextResponse|NextResponse, NextRequest) \} from 'next/server';)",
                r"\1\nimport { requireAdminRole } from '@/lib/auth/authorization';",
                content,
                count=1
            )

        # Step 2: Replace authorization blocks - handle multiple patterns
        # Pattern 1: Standard format
        content = re.sub(
            r'const session = await getServerSession\(authOptions\);\s*if \(\s*!session\?\.user \|\|\s*\(session\.user\.role !== UserRole\.ADMIN &&\s*session\.user\.role !== UserRole\.STAFF\)\s*\) \{\s*return NextResponse\.json\(\s*\{ (?:message|error): [\'"](?:Unauthorized\.? (?:Admin access required\.?)?|Unauthorized)[\'"] \},\s*\{ status: (?:401|403) \}\s*\);\s*\}',
            '// Authorization check\n    const { error, session } = await requireAdminRole();\n    if (error) return error;',
            content,
            flags=re.MULTILINE | re.DOTALL
        )

        # Pattern 2: Compact format
        content = re.sub(
            r'const session = await getServerSession\(authOptions\);\n\n    if \(!session\?\.user \|\| \(session\.user\.role !== UserRole\.ADMIN && session\.user\.role !== UserRole\.STAFF\)\) \{\n      return NextResponse\.json\(\{ (?:error|message): [\'"]Unauthorized[\'"] \}, \{ status: 401 \}\);\n    \}',
            '// Authorization check\n    const { error, session } = await requireAdminRole();\n    if (error) return error;',
            content
        )

        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✅ Updated: {filepath}")
            return True
        else:
            print(f"⚠️  No changes needed: {filepath}")
            return False

    except Exception as e:
        print(f"❌ Error updating {filepath}: {e}")
        return False

def main():
    print(f"🔄 Updating {len(files_to_update)} admin route files...")
    updated_count = 0

    for filepath in files_to_update:
        if os.path.exists(filepath):
            if update_file(filepath):
                updated_count += 1
        else:
            print(f"⚠️  File not found: {filepath}")

    print(f"\n✨ Complete! Updated {updated_count}/{len(files_to_update)} files")

if __name__ == '__main__':
    main()
