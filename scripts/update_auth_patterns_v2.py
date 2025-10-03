#!/usr/bin/env python3
"""
Script to update admin route authorization patterns - Version 2
Handles multiple handler functions and SUPERADMIN patterns
"""

import re
import os

files_to_update = [
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/customers/[customerId]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/payments/gateways/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/payments/stats/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/products/bulk/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/products/[id]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/discounts/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/shipping/config/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/agent-applications/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/agent-applications/[id]/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/orders/fulfillment/route.ts",
    "/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/membership/pending/route.ts",
]

def update_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        original_content = content
        changes_made = 0

        # Pattern 1: With SUPERADMIN (3-role check)
        pattern1 = re.compile(
            r'const session = await getServerSession\(authOptions\);\s*\n\s*\n\s*if \(\s*\n\s*!session\?\.user \|\|\s*\n\s*\(session\.user\.role !== UserRole\.ADMIN &&\s*\n\s*session\.user\.role !== UserRole\.STAFF &&\s*\n\s*session\.user\.role !== UserRole\.SUPERADMIN\)\s*\n\s*\) \{\s*\n\s*return NextResponse\.json\(\s*\n\s*\{ (?:message|error): [\'"][^\'"]*[\'"] \},\s*\n\s*\{ status: \d+ \}\s*\n\s*\);\s*\n\s*\}',
            re.MULTILINE
        )

        while pattern1.search(content):
            content = pattern1.sub(
                '// Authorization check\n    const { error, session } = await requireAdminRole();\n    if (error) return error;',
                content,
                count=1
            )
            changes_made += 1

        # Pattern 2: Without SUPERADMIN (2-role check) - multiline
        pattern2 = re.compile(
            r'const session = await getServerSession\(authOptions\);\s*\n\s*\n\s*if \(\s*\n\s*!session\?\.user \|\|\s*\n\s*\(session\.user\.role !== UserRole\.ADMIN &&\s*\n\s*session\.user\.role !== UserRole\.STAFF\)\s*\n\s*\) \{\s*\n\s*return NextResponse\.json\(\s*\n\s*\{ (?:message|error): [\'"][^\'"]*[\'"] \},\s*\n\s*\{ status: \d+ \}\s*\n\s*\);\s*\n\s*\}',
            re.MULTILINE
        )

        while pattern2.search(content):
            content = pattern2.sub(
                '// Authorization check\n    const { error, session } = await requireAdminRole();\n    if (error) return error;',
                content,
                count=1
            )
            changes_made += 1

        # Pattern 3: Compact single-line version
        pattern3 = re.compile(
            r'const session = await getServerSession\(authOptions\);\n\n    if \(!session\?\.user \|\| \(session\.user\.role !== UserRole\.ADMIN && session\.user\.role !== UserRole\.STAFF(?:&& session\.user\.role !== UserRole\.SUPERADMIN)?\)\) \{\n      return NextResponse\.json\(\{ (?:error|message): [\'"][^\'"]*[\'"] \}, \{ status: \d+ \}\);\n    \}',
            re.MULTILINE
        )

        while pattern3.search(content):
            content = pattern3.sub(
                '// Authorization check\n    const { error, session } = await requireAdminRole();\n    if (error) return error;',
                content,
                count=1
            )
            changes_made += 1

        # Pattern 4: For DELETE with SUPERADMIN only
        pattern4 = re.compile(
            r'const session = await getServerSession\(authOptions\);\s*\n\s*\n\s*if \(\s*\n\s*!session\?\.user \|\|\s*\n\s*\(session\.user\.role !== UserRole\.ADMIN &&\s*\n\s*session\.user\.role !== UserRole\.SUPERADMIN\)\s*\n\s*\) \{\s*\n\s*return NextResponse\.json\(\s*\n\s*\{ (?:message|error): [\'"][^\'"]*[\'"] \},\s*\n\s*\{ status: \d+ \}\s*\n\s*\);\s*\n\s*\}',
            re.MULTILINE
        )

        while pattern4.search(content):
            content = pattern4.sub(
                '// Authorization check\n    const { error, session } = await requireAdminRole();\n    if (error) return error;',
                content,
                count=1
            )
            changes_made += 1

        if changes_made > 0:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✅ Updated {filepath} ({changes_made} handler(s))")
            return True
        else:
            print(f"⚠️  No patterns matched: {filepath}")
            return False

    except Exception as e:
        print(f"❌ Error updating {filepath}: {e}")
        return False

def main():
    print(f"🔄 Updating {len(files_to_update)} remaining admin route files...")
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
