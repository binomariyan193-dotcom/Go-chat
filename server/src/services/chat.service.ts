import { supabaseAdmin } from '../config/supabase';

export const getUserConversations = async (userId: string) => {
  // 1. Get member rows for user
  const { data: memberRows, error: memberError } = await supabaseAdmin
    .from('ConversationMember')
    .select('conversationId')
    .eq('userId', userId);

  if (memberError) {
    throw new Error(`Failed to fetch user memberships: ${memberError.message}`);
  }

  let conversationIds = memberRows ? memberRows.map((r) => r.conversationId) : [];

  // If user has no conversations, automatically join/create a General Lounge
  if (conversationIds.length === 0) {
    // Check if General Lounge exists
    let { data: generalConv } = await supabaseAdmin
      .from('Conversation')
      .select('id')
      .eq('name', 'General Lounge')
      .single();

    if (!generalConv) {
      const { data: createdConv, error: createError } = await supabaseAdmin
        .from('Conversation')
        .insert([{ name: 'General Lounge', isGroup: true }])
        .select('id')
        .single();

      if (!createError && createdConv) {
        generalConv = createdConv;
      }
    }

    if (generalConv) {
      await supabaseAdmin.from('ConversationMember').insert([
        { conversationId: generalConv.id, userId },
      ]);
      conversationIds = [generalConv.id];
    }
  }

  if (conversationIds.length === 0) return [];

  // 2. Fetch conversations
  const { data: conversations, error: convError } = await supabaseAdmin
    .from('Conversation')
    .select('*')
    .in('id', conversationIds);

  if (convError) throw new Error(convError.message);

  // 3. Populate members and last message for each conversation
  const fullConversations = await Promise.all(
    conversations.map(async (conv) => {
      let members: any[] | null = null;
      const { data: memberWithRole, error: roleError } = await supabaseAdmin
        .from('ConversationMember')
        .select('role, user:User(id, username, avatarUrl, status)')
        .eq('conversationId', conv.id);

      if (roleError && roleError.message.includes('role')) {
        const { data: basicMembers } = await supabaseAdmin
          .from('ConversationMember')
          .select('user:User(id, username, avatarUrl, status)')
          .eq('conversationId', conv.id);
        members = basicMembers || [];
      } else {
        members = memberWithRole || [];
      }

      const { data: lastMessages } = await supabaseAdmin
        .from('Message')
        .select('*')
        .eq('conversationId', conv.id)
        .order('createdAt', { ascending: false })
        .limit(1);

      return {
        ...conv,
        members: members || [],
        messages: lastMessages || [],
      };
    })
  );

  // Sort conversations so that the latest active conversation appears at the top
  fullConversations.sort((a, b) => {
    const timeA = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : new Date(a.updatedAt).getTime();
    const timeB = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : new Date(b.updatedAt).getTime();
    return timeB - timeA;
  });

  return fullConversations;
};

export const fetchMessageReactions = async (messageId: string) => {
  const { data: reactionsRows, error } = await supabaseAdmin
    .from('MessageReaction')
    .select('emoji, userId')
    .eq('messageId', messageId);

  if (error || !reactionsRows) return [];

  const grouped: { [emoji: string]: string[] } = {};
  reactionsRows.forEach((r: any) => {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.userId);
  });

  return Object.keys(grouped).map((emoji) => ({
    emoji,
    count: grouped[emoji].length,
    userIds: grouped[emoji],
  }));
};

export const toggleReaction = async (messageId: string, userId: string, emoji: string) => {
  const { data: existing } = await supabaseAdmin
    .from('MessageReaction')
    .select('*')
    .eq('messageId', messageId)
    .eq('userId', userId)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('MessageReaction')
      .delete()
      .eq('id', existing.id);
  } else {
    await supabaseAdmin
      .from('MessageReaction')
      .insert([{ messageId, userId, emoji }]);
  }

  const reactions = await fetchMessageReactions(messageId);

  const { data: msg } = await supabaseAdmin
    .from('Message')
    .select('conversationId')
    .eq('id', messageId)
    .single();

  return {
    messageId,
    conversationId: msg?.conversationId,
    reactions,
  };
};

export const getConversationMessages = async (conversationId: string) => {
  let messages: any[] | null = null;
  let fetchError: any = null;

  // Try fetching with audioUrl
  const result = await supabaseAdmin
    .from('Message')
    .select(`
      id,
      conversationId,
      senderId,
      textContent,
      imageUrl,
      audioUrl,
      createdAt,
      sender:User (id, username, avatarUrl)
    `)
    .eq('conversationId', conversationId)
    .order('createdAt', { ascending: true });

  if (result.error && result.error.message.includes('audioUrl')) {
    // Fallback query if audioUrl column not created in Supabase SQL editor yet
    const fallbackResult = await supabaseAdmin
      .from('Message')
      .select(`
        id,
        conversationId,
        senderId,
        textContent,
        imageUrl,
        createdAt,
        sender:User (id, username, avatarUrl)
      `)
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true });

    messages = fallbackResult.data;
    fetchError = fallbackResult.error;
  } else {
    messages = result.data;
    fetchError = result.error;
  }

  if (fetchError) throw new Error(`Failed to fetch messages: ${fetchError.message}`);
  if (!messages || messages.length === 0) return [];

  // Fetch reactions safely without crashing if MessageReaction table doesn't exist yet
  let reactionsRows: any[] | null = null;
  try {
    const messageIds = messages.map((m) => m.id);
    const reactionsResult = await supabaseAdmin
      .from('MessageReaction')
      .select('messageId, emoji, userId')
      .in('messageId', messageIds);
    reactionsRows = reactionsResult.data;
  } catch (err) {
    reactionsRows = [];
  }

  const reactionsByMsg: { [msgId: string]: { [emoji: string]: string[] } } = {};
  if (reactionsRows) {
    reactionsRows.forEach((r: any) => {
      if (!reactionsByMsg[r.messageId]) reactionsByMsg[r.messageId] = {};
      if (!reactionsByMsg[r.messageId][r.emoji]) reactionsByMsg[r.messageId][r.emoji] = [];
      reactionsByMsg[r.messageId][r.emoji].push(r.userId);
    });
  }

  return messages.map((m) => {
    const msgReactions = reactionsByMsg[m.id] || {};
    const formattedReactions = Object.keys(msgReactions).map((emoji) => ({
      emoji,
      count: msgReactions[emoji].length,
      userIds: msgReactions[emoji],
    }));

    return {
      ...m,
      reactions: formattedReactions,
    };
  });
};

export const createMessage = async (
  conversationId: string,
  senderId: string,
  textContent?: string,
  imageUrl?: string,
  audioUrl?: string
) => {
  const insertPayload: any = {
    conversationId,
    senderId,
    textContent,
    imageUrl,
  };

  if (audioUrl) {
    insertPayload.audioUrl = audioUrl;
  }

  const { data: newMessage, error } = await supabaseAdmin
    .from('Message')
    .insert([insertPayload])
    .select(`
      id,
      conversationId,
      senderId,
      textContent,
      imageUrl,
      audioUrl,
      createdAt,
      sender:User (id, username, avatarUrl)
    `)
    .single();

  if (error && error.message.includes('audioUrl')) {
    const fallbackPayload: any = {
      conversationId,
      senderId,
      textContent: textContent || undefined,
      imageUrl,
    };
    if (audioUrl) {
      fallbackPayload.textContent = textContent ? `${textContent} (Voice Note: ${audioUrl})` : audioUrl;
    }

    const { data: fallbackMessage, error: fallbackError } = await supabaseAdmin
      .from('Message')
      .insert([fallbackPayload])
      .select(`
        id,
        conversationId,
        senderId,
        textContent,
        imageUrl,
        createdAt,
        sender:User (id, username, avatarUrl)
      `)
      .single();

    if (fallbackError) throw new Error(`Failed to create message: ${fallbackError.message}`);
    return { ...fallbackMessage, audioUrl };
  }

  if (error) throw new Error(`Failed to create message: ${error.message}`);
  return newMessage;
};

export const getAllUsers = async (currentUserId: string) => {
  const { data: users, error } = await supabaseAdmin
    .from('User')
    .select('id, username, email, avatarUrl, status')
    .neq('id', currentUserId);

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return users || [];
};

export const createOrGetDirectConversation = async (currentUserId: string, targetUserId: string) => {
  let targetConvId: string | null = null;

  // Find existing DM between these 2 users
  const { data: currentMembers } = await supabaseAdmin
    .from('ConversationMember')
    .select('conversationId')
    .eq('userId', currentUserId);

  if (currentMembers && currentMembers.length > 0) {
    const currentConvIds = currentMembers.map((m) => m.conversationId);
    const { data: commonMember } = await supabaseAdmin
      .from('ConversationMember')
      .select('conversationId')
      .eq('userId', targetUserId)
      .in('conversationId', currentConvIds)
      .limit(1);

    if (commonMember && commonMember.length > 0) {
      const existingConvId = commonMember[0].conversationId;
      const { data: existingConv } = await supabaseAdmin
        .from('Conversation')
        .select('*')
        .eq('id', existingConvId)
        .eq('isGroup', false)
        .single();

      if (existingConv) {
        targetConvId = existingConv.id;
      }
    }
  }

  // Create new DM conversation if not found
  if (!targetConvId) {
    const { data: newConv, error: createError } = await supabaseAdmin
      .from('Conversation')
      .insert([{ isGroup: false }])
      .select('*')
      .single();

    if (createError) throw new Error(createError.message);

    await supabaseAdmin.from('ConversationMember').insert([
      { conversationId: newConv.id, userId: currentUserId },
      { conversationId: newConv.id, userId: targetUserId },
    ]);

    targetConvId = newConv.id;
  }

  // Fetch full conversation object with members and messages
  const { data: conv } = await supabaseAdmin
    .from('Conversation')
    .select('*')
    .eq('id', targetConvId)
    .single();

  const { data: members } = await supabaseAdmin
    .from('ConversationMember')
    .select('user:User(id, username, avatarUrl, status)')
    .eq('conversationId', targetConvId);

  const { data: lastMessages } = await supabaseAdmin
    .from('Message')
    .select('*')
    .eq('conversationId', targetConvId)
    .order('createdAt', { ascending: false })
    .limit(1);

  return {
    ...conv,
    members: members || [],
    messages: lastMessages || [],
  };
};

export const editMessage = async (messageId: string, senderId: string, textContent: string) => {
  // 1. Fetch message
  const { data: existingMsg, error: fetchError } = await supabaseAdmin
    .from('Message')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError || !existingMsg) {
    throw new Error('Message not found');
  }

  // 2. Sender validation
  if (existingMsg.senderId !== senderId) {
    throw new Error('Unauthorized to edit this message');
  }

  // 3. 15-second edit window validation
  const createdAtMs = new Date(existingMsg.createdAt).getTime();
  const elapsedMs = Date.now() - createdAtMs;

  if (elapsedMs > 15000) {
    throw new Error('Edit window expired (15-second time limit exceeded)');
  }

  // 4. Update message
  const { data: updatedMsg, error: updateError } = await supabaseAdmin
    .from('Message')
    .update({ textContent })
    .eq('id', messageId)
    .select(`
      id,
      conversationId,
      senderId,
      textContent,
      imageUrl,
      createdAt,
      sender:User (id, username, avatarUrl)
    `)
    .single();

  if (updateError) {
    throw new Error(`Failed to update message: ${updateError.message}`);
  }

  return updatedMsg;
};

export const deleteConversation = async (conversationId: string, userId: string) => {
  // 1. Verify user is a member of the conversation
  const { data: member, error: memberError } = await supabaseAdmin
    .from('ConversationMember')
    .select('*')
    .eq('conversationId', conversationId)
    .eq('userId', userId)
    .single();

  if (memberError || !member) {
    throw new Error('Unauthorized or conversation not found');
  }

  // 2. Delete all messages in the conversation
  await supabaseAdmin.from('Message').delete().eq('conversationId', conversationId);

  // 3. Delete all conversation members
  await supabaseAdmin.from('ConversationMember').delete().eq('conversationId', conversationId);

  // 4. Delete the conversation record
  const { error: deleteError } = await supabaseAdmin
    .from('Conversation')
    .delete()
    .eq('id', conversationId);

  if (deleteError) {
    throw new Error(`Failed to delete conversation: ${deleteError.message}`);
  }

  return { conversationId };
};

export const deleteMessage = async (messageId: string, senderId: string) => {
  // 1. Fetch message
  const { data: existingMsg, error: fetchError } = await supabaseAdmin
    .from('Message')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError || !existingMsg) {
    throw new Error('Message not found');
  }

  // 2. Sender validation
  if (existingMsg.senderId !== senderId) {
    throw new Error('Unauthorized to delete this message');
  }

  // 3. Delete message
  const { error: deleteError } = await supabaseAdmin
    .from('Message')
    .delete()
    .eq('id', messageId);

  if (deleteError) {
    throw new Error(`Failed to delete message: ${deleteError.message}`);
  }

  return { messageId, conversationId: existingMsg.conversationId };
};

export const createGroupConversation = async (
  creatorId: string,
  name: string,
  description?: string,
  avatarUrl?: string,
  memberUserIds: string[] = []
) => {
  if (!name || name.trim().length === 0) {
    throw new Error('Group name is required');
  }

  // 1. Insert conversation
  const convPayload: any = {
    name: name.trim(),
    isGroup: true,
  };
  if (description) convPayload.description = description;
  if (avatarUrl) convPayload.avatarUrl = avatarUrl;

  let newConv: any = null;
  let createError: any = null;

  const res = await supabaseAdmin
    .from('Conversation')
    .insert([convPayload])
    .select('*')
    .single();

  if (res.error && (res.error.message.includes('description') || res.error.message.includes('avatarUrl'))) {
    const fallbackRes = await supabaseAdmin
      .from('Conversation')
      .insert([{ name: name.trim(), isGroup: true }])
      .select('*')
      .single();
    newConv = fallbackRes.data;
    createError = fallbackRes.error;
  } else {
    newConv = res.data;
    createError = res.error;
  }

  if (createError || !newConv) throw new Error(`Failed to create group: ${createError?.message}`);

  // 2. Prepare member rows: Creator is 'admin', others are 'member'
  const allUserIds = Array.from(new Set([creatorId, ...memberUserIds]));
  const memberRows = allUserIds.map((userId) => ({
    conversationId: newConv.id,
    userId,
    role: userId === creatorId ? 'admin' : 'member',
  }));

  const { error: memberError } = await supabaseAdmin
    .from('ConversationMember')
    .insert(memberRows);

  if (memberError && memberError.message.includes('role')) {
    // Fallback without role column if SQL migration not executed yet
    const basicMemberRows = allUserIds.map((userId) => ({
      conversationId: newConv.id,
      userId,
    }));
    await supabaseAdmin.from('ConversationMember').insert(basicMemberRows);
  } else if (memberError) {
    throw new Error(`Failed to add group members: ${memberError.message}`);
  }

  // 3. Retrieve populated conversation
  let members: any[] | null = null;
  const { data: memberWithRole, error: roleError } = await supabaseAdmin
    .from('ConversationMember')
    .select('role, user:User(id, username, avatarUrl, status)')
    .eq('conversationId', newConv.id);

  if (roleError && roleError.message.includes('role')) {
    const { data: basicMembers } = await supabaseAdmin
      .from('ConversationMember')
      .select('user:User(id, username, avatarUrl, status)')
      .eq('conversationId', newConv.id);
    members = basicMembers || [];
  } else {
    members = memberWithRole || [];
  }

  return {
    ...newConv,
    members: members || [],
    messages: [],
  };
};

export const updateGroupDetails = async (
  conversationId: string,
  requesterId: string,
  updates: { name?: string; description?: string; avatarUrl?: string | null }
) => {
  if (updates.avatarUrl === '' || updates.avatarUrl === null) {
    updates.avatarUrl = null;
  }
  // Validate requester is group member/admin
  let isAdmin = false;
  const { data: member, error: memberErr } = await supabaseAdmin
    .from('ConversationMember')
    .select('role')
    .eq('conversationId', conversationId)
    .eq('userId', requesterId)
    .single();

  if (memberErr && memberErr.message.includes('role')) {
    const { data: basicMember } = await supabaseAdmin
      .from('ConversationMember')
      .select('id')
      .eq('conversationId', conversationId)
      .eq('userId', requesterId)
      .single();
    if (basicMember) isAdmin = true;
  } else if (member && (!member.role || member.role === 'admin')) {
    isAdmin = true;
  }

  if (!isAdmin) {
    throw new Error('Only Group Admins can update group details');
  }

  const cleanUpdates: any = {};
  if (updates.name !== undefined && updates.name !== null) cleanUpdates.name = updates.name;
  if (updates.description !== undefined) cleanUpdates.description = updates.description;
  if (updates.avatarUrl !== undefined) cleanUpdates.avatarUrl = updates.avatarUrl === '' ? null : updates.avatarUrl;

  let updatedConv: any = null;
  let updateError: any = null;

  const res = await supabaseAdmin
    .from('Conversation')
    .update(cleanUpdates)
    .eq('id', conversationId)
    .select('*')
    .single();

  if (res.error && (res.error.message.includes('description') || res.error.message.includes('avatarUrl'))) {
    console.warn(`⚠️ [DATABASE MIGRATION MISSING] avatarUrl/description column missing: ${res.error.message}`);
    const fallbackRes = await supabaseAdmin
      .from('Conversation')
      .update({ name: cleanUpdates.name || 'Group' })
      .eq('id', conversationId)
      .select('*')
      .single();
    updatedConv = fallbackRes.data;
    updateError = fallbackRes.error;
  } else {
    updatedConv = res.data;
    updateError = res.error;
  }

  if (updateError) throw new Error(`Failed to update group details: ${updateError.message}`);
  return updatedConv;
};

export const addGroupMembers = async (
  conversationId: string,
  requesterId: string,
  newMemberUserIds: string[]
) => {
  // Validate requester is group member/admin
  let isAdmin = false;
  const { data: member, error: memberErr } = await supabaseAdmin
    .from('ConversationMember')
    .select('role')
    .eq('conversationId', conversationId)
    .eq('userId', requesterId)
    .single();

  if (memberErr && memberErr.message.includes('role')) {
    const { data: basicMember } = await supabaseAdmin
      .from('ConversationMember')
      .select('id')
      .eq('conversationId', conversationId)
      .eq('userId', requesterId)
      .single();
    if (basicMember) isAdmin = true;
  } else if (member && (!member.role || member.role === 'admin')) {
    isAdmin = true;
  }

  if (!isAdmin) {
    throw new Error('Only Group Admins can add members to this group');
  }

  const memberRows = newMemberUserIds.map((userId) => ({
    conversationId,
    userId,
    role: 'member',
  }));

  const { error: insertErr } = await supabaseAdmin.from('ConversationMember').insert(memberRows);

  if (insertErr && insertErr.message.includes('role')) {
    const basicMemberRows = newMemberUserIds.map((userId) => ({
      conversationId,
      userId,
    }));
    await supabaseAdmin.from('ConversationMember').insert(basicMemberRows);
  } else if (insertErr) {
    throw new Error(`Failed to add members: ${insertErr.message}`);
  }

  let members: any[] | null = null;
  const { data: memberWithRole, error: roleError } = await supabaseAdmin
    .from('ConversationMember')
    .select('role, user:User(id, username, avatarUrl, status)')
    .eq('conversationId', conversationId);

  if (roleError && roleError.message.includes('role')) {
    const { data: basicMembers } = await supabaseAdmin
      .from('ConversationMember')
      .select('user:User(id, username, avatarUrl, status)')
      .eq('conversationId', conversationId);
    members = basicMembers || [];
  } else {
    members = memberWithRole || [];
  }

  return { conversationId, members: members || [] };
};

export const removeGroupMember = async (
  conversationId: string,
  requesterId: string,
  targetUserId: string
) => {
  // If requester is not removing self, verify requester is admin
  if (requesterId !== targetUserId) {
    const { data: requesterMember } = await supabaseAdmin
      .from('ConversationMember')
      .select('role')
      .eq('conversationId', conversationId)
      .eq('userId', requesterId)
      .single();

    if (!requesterMember || (requesterMember.role && requesterMember.role !== 'admin')) {
      throw new Error('Only Group Admins can remove members');
    }
  }

  const { error } = await supabaseAdmin
    .from('ConversationMember')
    .delete()
    .eq('conversationId', conversationId)
    .eq('userId', targetUserId);

  if (error) throw new Error(`Failed to remove member: ${error.message}`);
  return { conversationId, targetUserId };
};

export const updateMemberRole = async (
  conversationId: string,
  requesterId: string,
  targetUserId: string,
  newRole: 'admin' | 'member'
) => {
  // Validate requester is group admin
  const { data: requesterMember } = await supabaseAdmin
    .from('ConversationMember')
    .select('role')
    .eq('conversationId', conversationId)
    .eq('userId', requesterId)
    .single();

  if (!requesterMember || (requesterMember.role && requesterMember.role !== 'admin')) {
    throw new Error('Only Group Admins can change member roles');
  }

  const { error } = await supabaseAdmin
    .from('ConversationMember')
    .update({ role: newRole })
    .eq('conversationId', conversationId)
    .eq('userId', targetUserId);

  if (error) throw new Error(`Failed to update member role: ${error.message}`);

  const { data: members } = await supabaseAdmin
    .from('ConversationMember')
    .select('role, user:User(id, username, avatarUrl, status)')
    .eq('conversationId', conversationId);

  return { conversationId, members: members || [] };
};


