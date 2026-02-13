-- Migration: Add Messaging System
-- Description: Creates tables for role-based internal messaging between department heads, instructors, and students

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_deleted_by_sender BOOLEAN DEFAULT false,
    is_deleted_by_receiver BOOLEAN DEFAULT false,
    parent_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT sender_receiver_different CHECK (sender_id != receiver_id)
);

-- Create conversations table for tracking message threads
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    participant_one_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_two_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique conversation pairs (regardless of order)
    CONSTRAINT unique_conversation UNIQUE (participant_one_id, participant_two_id),
    CONSTRAINT participants_different CHECK (participant_one_id != participant_two_id)
);

-- Create message_attachments table for file support (optional advanced feature)
CREATE TABLE IF NOT EXISTS message_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for messages
CREATE TRIGGER messages_updated_at_trigger
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Create trigger for conversations
CREATE TRIGGER conversations_updated_at_trigger
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Add comments for documentation
COMMENT ON TABLE messages IS 'Stores all messages between users with role-based access control';
COMMENT ON TABLE conversations IS 'Tracks conversation threads between two users';
COMMENT ON TABLE message_attachments IS 'Stores file attachments for messages (optional feature)';
COMMENT ON COLUMN messages.is_deleted_by_sender IS 'Soft delete flag for sender';
COMMENT ON COLUMN messages.is_deleted_by_receiver IS 'Soft delete flag for receiver';
COMMENT ON COLUMN messages.parent_message_id IS 'References parent message for threading';
