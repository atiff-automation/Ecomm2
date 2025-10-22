-- Add password reset token fields to users table
-- These fields are used for the password reset functionality

-- Add passwordResetToken column
ALTER TABLE "users" ADD COLUMN "passwordResetToken" TEXT;

-- Add passwordResetTokenExpiry column
ALTER TABLE "users" ADD COLUMN "passwordResetTokenExpiry" TIMESTAMP(3);

-- Create unique index on passwordResetToken
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
