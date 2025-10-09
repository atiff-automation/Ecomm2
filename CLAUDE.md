##IMPORTANT##

## Coding Standards

**🔴 MANDATORY:** All code in this project MUST follow the comprehensive coding standards defined in `claudedocs/CODING_STANDARDS.md`. These are non-negotiable requirements for all development work.

### Core Requirements

1. **Single Source of Truth**
   - Every piece of data or configuration has ONE authoritative source
   - Never duplicate code, data definitions, or configurations across files
   - Extract common functionality into reusable utilities and constants

2. **No Hardcoding**
   - Use constants, environment variables, and configuration files
   - Never hardcode URLs, API keys, status strings, or business logic values
   - All secrets MUST be in environment variables

3. **Software Architecture Principles**
   - Follow SOLID principles (Single Responsibility, Open/Closed, etc.)
   - Apply DRY (Don't Repeat Yourself) - extract common patterns
   - Keep solutions SIMPLE (KISS) - avoid unnecessary complexity
   - Use centralized approaches for shared functionality

4. **Systematic Implementation**
   - Always plan before coding
   - Follow implementation specifications and planning documents
   - Maintain consistency with existing patterns in the codebase
   - Adhere to the three-layer validation principle (Frontend → API → Database)

5. **Type Safety & Quality**
   - No `any` types - use explicit TypeScript types everywhere
   - All async operations must have try-catch blocks
   - All user inputs must be validated with Zod schemas
   - All database operations must use Prisma (no raw SQL)

**⚠️ Failure to follow these standards will result in code review rejection.**