import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export const messageService = {
  // Get all messages for current user
  async getMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sales_reps!messages_sender_id_fkey(
          id,
          name,
          phone
        ),
        recipient:sales_reps!messages_recipient_id_fkey(
          id,
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get conversation between two users
  async getConversation(otherUserId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sales_reps!messages_sender_id_fkey(
          id,
          name,
          phone
        ),
        recipient:sales_reps!messages_recipient_id_fkey(
          id,
          name,
          phone
        )
      `)
      .or(`and(sender_id.eq.${otherUserId}),and(recipient_id.eq.${otherUserId})`)
      .order('created_at', { ascending: true });

    return { data, error };
  },

  // Send message
  async sendMessage(recipientId: string, content: string, subject?: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        recipient_id: recipientId,
        content,
        subject,
        message_type: 'direct'
      })
      .select(`
        *,
        sender:sales_reps!messages_sender_id_fkey(
          id,
          name,
          phone
        ),
        recipient:sales_reps!messages_recipient_id_fkey(
          id,
          name,
          phone
        )
      `)
      .single();

    return { data, error };
  },

  // Mark message as read
  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    return { error };
  },

  // Mark all messages from a user as read
  async markConversationAsRead(senderId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('is_read', false);

    return { error };
  },

  // Get unread message count
  async getUnreadCount() {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    return { count: count || 0, error };
  },

  // Delete message
  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    return { error };
  }
};