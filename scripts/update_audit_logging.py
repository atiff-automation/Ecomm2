#!/usr/bin/env python3
"""
Script to update audit logging patterns
Replaces old try-catch wrapped prisma.auditLog.create with logAudit() helper
"""

import re
import os
import glob

# Find all files with audit logging
admin_routes = glob.glob('/Users/atiffriduan/Desktop/EcomJRM/src/app/api/admin/**/route.ts', recursive=True)

def update_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        original_content = content
        changes_made = 0

        # Check if file has prisma.auditLog.create
        if 'prisma.auditLog.create' not in content:
            return False

        # Step 1: Add logAudit import if not present
        if 'logAudit' not in content:
            # Add import after other imports
            if "from '@/lib/db/prisma';" in content:
                content = content.replace(
                    "from '@/lib/db/prisma';",
                    "from '@/lib/db/prisma';\nimport { logAudit } from '@/lib/audit/logger';"
                )
                changes_made += 1

        # Step 2: Replace audit log patterns
        # Pattern: try { await prisma.auditLog.create({ ... }) } catch { ... }

        # More flexible regex to match the try-catch block
        pattern = re.compile(
            r'// Log the action \(skip if audit log fails\)\s*\n\s*try \{\s*\n\s*await prisma\.auditLog\.create\(\{([^}]+data:\s*\{[^}]+\}[^}]*)\}\);\s*\n\s*\} catch \([^\)]+\) \{\s*\n\s*console\.warn\([^\)]+\);[^}]*\n\s*\}',
            re.MULTILINE | re.DOTALL
        )

        def replace_audit_log(match):
            data_content = match.group(1)

            # Extract fields from data object
            user_id_match = re.search(r'userId:\s*([^,\n]+)', data_content)
            action_match = re.search(r"action:\s*['\"](\w+)['\"]", data_content)
            resource_match = re.search(r"resource:\s*['\"](\w+)['\"]", data_content)
            resource_id_match = re.search(r'resourceId:\s*([^,\n]+)', data_content)
            details_match = re.search(r'details:\s*(\{[^}]+\})', data_content, re.DOTALL)

            if not all([user_id_match, action_match, resource_match]):
                return match.group(0)  # Return original if can't parse

            user_id = user_id_match.group(1).strip()
            action = action_match.group(1)
            resource = resource_match.group(1)
            resource_id = resource_id_match.group(1).strip() if resource_id_match else 'undefined'
            details = details_match.group(1).strip() if details_match else '{}'

            # Build new logAudit call
            return f'''// Audit log
    await logAudit({{
      userId: {user_id},
      action: '{action}',
      resource: '{resource}',
      resourceId: {resource_id},
      details: {details},
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }});'''

        new_content = pattern.sub(replace_audit_log, content)

        if new_content != content:
            content = new_content
            changes_made += 1

        if changes_made > 0 and content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✅ Updated: {filepath} ({changes_made} change(s))")
            return True
        else:
            return False

    except Exception as e:
        print(f"❌ Error updating {filepath}: {e}")
        return False

def main():
    files_with_audit = []

    # Find files with audit logging
    for filepath in admin_routes:
        try:
            with open(filepath, 'r') as f:
                if 'prisma.auditLog.create' in f.read():
                    files_with_audit.append(filepath)
        except:
            pass

    print(f"🔄 Found {len(files_with_audit)} files with audit logging...")
    updated_count = 0

    for filepath in files_with_audit:
        if update_file(filepath):
            updated_count += 1

    print(f"\n✨ Complete! Updated {updated_count}/{len(files_with_audit)} files")

if __name__ == '__main__':
    main()
