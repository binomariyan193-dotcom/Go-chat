import { supabaseAdmin } from '../config/supabase';
import { createOrGetDirectConversation } from './chat.service';

export const searchUsersWithFriendStatus = async (currentUserId: string, query: string) => {
  if (!query || query.trim().length === 0) return [];

  // 1. Search users by username (privacy: do not expose email in public search)
  const { data: users, error } = await supabaseAdmin
    .from('User')
    .select('id, username, avatarUrl')
    .neq('id', currentUserId)
    .ilike('username', `%${query}%`)
    .limit(20);

  if (error) throw new Error(`Search failed: ${error.message}`);
  if (!users || users.length === 0) return [];

  const targetUserIds = users.map((u) => u.id);

  // 2. Fetch friend requests sent or received involving current user and target users
  const { data: sentReqs } = await supabaseAdmin
    .from('FriendRequest')
    .select('*')
    .eq('senderId', currentUserId)
    .in('receiverId', targetUserIds);

  const { data: receivedReqs } = await supabaseAdmin
    .from('FriendRequest')
    .select('*')
    .eq('receiverId', currentUserId)
    .in('senderId', targetUserIds);

  // 3. Map friendship status
  return users.map((u) => {
    const sent = sentReqs?.find((r) => r.receiverId === u.id);
    const received = receivedReqs?.find((r) => r.senderId === u.id);

    let friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none';

    if (sent) {
      friendshipStatus = sent.status === 'accepted' ? 'accepted' : 'pending_sent';
    } else if (received) {
      friendshipStatus = received.status === 'accepted' ? 'accepted' : 'pending_received';
    }

    return {
      ...u,
      friendshipStatus,
      requestId: sent?.id || received?.id,
    };
  });
};

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  if (senderId === receiverId) throw new Error('Cannot send friend request to yourself');

  // Check if existing request exists
  const { data: existing } = await supabaseAdmin
    .from('FriendRequest')
    .select('*')
    .or(`and(senderId.eq.${senderId},receiverId.eq.${receiverId}),and(senderId.eq.${receiverId},receiverId.eq.${senderId})`)
    .single();

  if (existing) {
    if (existing.status === 'accepted') throw new Error('You are already friends');
    throw new Error('Friend request already exists');
  }

  const { data: request, error } = await supabaseAdmin
    .from('FriendRequest')
    .insert([{ senderId, receiverId, status: 'pending' }])
    .select('*')
    .single();

  if (error) throw new Error(`Failed to send friend request: ${error.message}`);
  return request;
};

export const getPendingRequests = async (userId: string) => {
  const { data: requests, error } = await supabaseAdmin
    .from('FriendRequest')
    .select(`
      id,
      senderId,
      createdAt,
      sender:User!senderId (id, username, avatarUrl)
    `)
    .eq('receiverId', userId)
    .eq('status', 'pending');

  if (error) throw new Error(`Failed to fetch requests: ${error.message}`);
  return requests || [];
};

export const respondToFriendRequest = async (requestId: string, userId: string, action: 'accept' | 'reject') => {
  const { data: request, error: fetchError } = await supabaseAdmin
    .from('FriendRequest')
    .select('*')
    .eq('id', requestId)
    .eq('receiverId', userId)
    .single();

  if (fetchError || !request) throw new Error('Friend request not found');

  if (action === 'accept') {
    // 1. Update status to accepted
    const { error: updateError } = await supabaseAdmin
      .from('FriendRequest')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw new Error(updateError.message);

    // 2. Automatically create 1-on-1 DM conversation
    const conversation = await createOrGetDirectConversation(request.senderId, request.receiverId);
    return { status: 'accepted', conversation };
  } else {
    // Reject or delete
    const { error: deleteError } = await supabaseAdmin
      .from('FriendRequest')
      .delete()
      .eq('id', requestId);

    if (deleteError) throw new Error(deleteError.message);
    return { status: 'rejected' };
  }
};
