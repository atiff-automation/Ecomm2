-- Migration: Unified Site Customization
-- Creates unified site_customization table and migrates data from hero_sections and site_themes
-- Following single source of truth principle from CLAUDE.md

-- Create the new unified site_customization table
CREATE TABLE site_customization (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    config JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_site_customization_active ON site_customization(is_active);
CREATE INDEX idx_site_customization_version ON site_customization(version);
CREATE INDEX idx_site_customization_created_at ON site_customization(created_at);

-- Migration function to consolidate existing data
CREATE OR REPLACE FUNCTION migrate_site_customization_data() RETURNS void AS $$
DECLARE
    active_hero RECORD;
    active_theme RECORD;
    unified_config JSONB;
    creator_id TEXT;
BEGIN
    -- Get active hero section
    SELECT * INTO active_hero FROM hero_sections WHERE is_active = true LIMIT 1;
    
    -- Get active site theme  
    SELECT * INTO active_theme FROM site_themes WHERE is_active = true LIMIT 1;
    
    -- Determine creator (prioritize hero section creator, fallback to theme creator)
    IF active_hero.created_by IS NOT NULL THEN
        creator_id := active_hero.created_by;
    ELSIF active_theme.created_by IS NOT NULL THEN
        creator_id := active_theme.created_by;
    ELSE
        creator_id := NULL;
    END IF;
    
    -- Build unified configuration JSON
    unified_config := jsonb_build_object(
        'hero', jsonb_build_object(
            'title', COALESCE(active_hero.title, 'Welcome to JRM E-commerce'),
            'subtitle', COALESCE(active_hero.subtitle, 'Malaysia''s premier online marketplace'),
            'description', COALESCE(active_hero.description, 'Intelligent membership benefits, dual pricing, and local payment integration.'),
            'ctaPrimary', jsonb_build_object(
                'text', COALESCE(active_hero.cta_primary_text, 'Join as Member'),
                'link', COALESCE(active_hero.cta_primary_link, '/auth/signup')
            ),
            'ctaSecondary', jsonb_build_object(
                'text', COALESCE(active_hero.cta_secondary_text, 'Browse Products'),
                'link', COALESCE(active_hero.cta_secondary_link, '/products')
            ),
            'background', jsonb_build_object(
                'type', COALESCE(active_hero.background_type::text, 'IMAGE'),
                'url', COALESCE(active_hero.background_image, active_hero.background_video),
                'overlayOpacity', COALESCE(active_hero.overlay_opacity, 0.1)
            ),
            'layout', jsonb_build_object(
                'textAlignment', COALESCE(active_hero.text_alignment, 'left'),
                'showTitle', COALESCE(active_hero.show_title, true),
                'showCTA', COALESCE(active_hero.show_cta, true)
            )
        ),
        'branding', jsonb_build_object(
            'logo', CASE 
                WHEN active_theme.logo_url IS NOT NULL THEN
                    jsonb_build_object(
                        'url', active_theme.logo_url,
                        'width', COALESCE(active_theme.logo_width, 120),
                        'height', COALESCE(active_theme.logo_height, 40)
                    )
                ELSE NULL
            END,
            'favicon', CASE 
                WHEN active_theme.favicon_url IS NOT NULL THEN
                    jsonb_build_object('url', active_theme.favicon_url)
                ELSE NULL
            END,
            'colors', jsonb_build_object(
                'primary', COALESCE(active_theme.primary_color, '#3B82F6'),
                'secondary', COALESCE(active_theme.secondary_color, '#FDE047'),
                'background', COALESCE(active_theme.background_color, '#F8FAFC'),
                'text', COALESCE(active_theme.text_color, '#1E293B')
            )
        ),
        'metadata', jsonb_build_object(
            'migratedFrom', 'hero_sections_and_site_themes',
            'migratedAt', CURRENT_TIMESTAMP,
            'heroSectionId', active_hero.id,
            'siteThemeId', active_theme.id
        )
    );
    
    -- Insert the unified configuration
    INSERT INTO site_customization (config, version, is_active, created_by, created_at, updated_at)
    VALUES (
        unified_config,
        1,
        true,
        creator_id,
        COALESCE(active_hero.created_at, active_theme.created_at, CURRENT_TIMESTAMP),
        CURRENT_TIMESTAMP
    );
    
    -- Archive existing records (mark as inactive instead of deleting for rollback capability)
    UPDATE hero_sections SET is_active = false WHERE is_active = true;
    UPDATE site_themes SET is_active = false WHERE is_active = true;
    
    RAISE NOTICE 'Site customization data migrated successfully';
    RAISE NOTICE 'Hero section: %, Theme: %, Creator: %', 
        COALESCE(active_hero.id, 'none'), 
        COALESCE(active_theme.id, 'none'), 
        COALESCE(creator_id, 'system');
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_site_customization_data();

-- Clean up the migration function (optional)
DROP FUNCTION IF EXISTS migrate_site_customization_data();

-- Add audit log entry for migration
INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent, created_at)
VALUES (
    NULL, -- System migration
    'SITE_CUSTOMIZATION_MIGRATION',
    'SYSTEM',
    '{"action": "unified_migration", "from": ["hero_sections", "site_themes"], "to": "site_customization", "timestamp": "' || CURRENT_TIMESTAMP || '"}',
    'system',
    'database_migration',
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;  -- Handle case where audit_logs doesn't exist yet

COMMIT;