'use client';
import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Navigation from './Navigation';
import ConversationList from './ConversationList';
import ChatView from '@/components/chat/ChatView';
import ConversationDetails from '@/components/chat/ConversationDetails';
import FriendsView from '@/components/friends/FriendsView';
import GroupsView from '@/components/groups/GroupsView';
import NewConversation from '@/components/groups/NewConversation';
import GroupSettings from '@/components/groups/GroupSettings';
import SettingsView from '@/components/settings/SettingsView';
import Modal from '@/components/ui/Modal';
import { useDirectory } from '@/hooks/useDirectory';
import { useMessages } from '@/hooks/useMessages';
import { useRealtime } from '@/hooks/useRealtime';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { api } from '@/lib/client-api';
import { messageSound } from '@/lib/sound';

export default function Workspace({ user, onUpdated, onLogout, onPasswordChanged }) {
  const [view, setView] = useState('messages');
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(false);
  const [modal, setModal] = useState(null);
  const [manageGroup, setManageGroup] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const reportError = useCallback((message) => setError(message), []);
  const directory = useDirectory(user, reportError);
  const groupInvitations = useGroupInvitations(reportError);
  const active = directory.conversations.find((c) => c.id === selectedId);
  const chatPage = view === 'messages' || view === 'archive';
  const messageState = useMessages(chatPage ? selectedId : null, reportError);
  const safeRefresh = useCallback(
    () => directory.refreshConversations().catch((error) => reportError(error.message)),
    [directory.refreshConversations, reportError],
  );
  const realtime = useRealtime(user, {
    onMessage: (message) => {
      messageState.receive(message);
      safeRefresh();
      if (
        message.sender.id !== user.id &&
        user.preferences?.sound !== false &&
        !directory.conversations.find((c) => c.id === message.conversationId)?.muted
      )
        messageSound();
    },
    onRead: (event) => {
      messageState.read(event);
      safeRefresh();
    },
    onFriends: directory.refresh,
    onInvitations: groupInvitations.refresh,
    onConversations: directory.refresh,
    onReconnect: () => {
      directory.refresh();
      groupInvitations.refresh();
      messageState.reload();
    },
  });
  useEffect(() => {
    if (!directory.loading && selectedId && !active) {
      setSelectedId(null);
      setDetails(false);
      setManageGroup(false);
    }
  }, [directory.loading, directory.conversations, selectedId]);
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 7000);
    return () => clearTimeout(timer);
  }, [error]);
  function changeView(next) {
    setManageGroup(false);
    setView(next);
    setDetails(false);
  }
  function select(id) {
    setManageGroup(false);
    setSelectedId(id);
    setDetails(false);
    setView('messages');
  }
  async function created(id) {
    await directory.refreshConversations();
    select(id);
  }
  async function startChat(userId) {
    try {
      const data = await api('/conversations', {
        method: 'POST',
        body: { kind: 'direct', userId },
      });
      await created(data.id);
    } catch (error) {
      reportError(error.message);
    }
  }
  async function flag(name, value) {
    try {
      await api(`/conversations/${selectedId}`, { method: 'PATCH', body: { [name]: value } });
      await directory.refreshConversations();
      if (name === 'archived') {
        setSelectedId(null);
        setDetails(false);
      }
    } catch (error) {
      reportError(error.message);
    }
  }
  function relationship(id, action) {
    setConfirm({
      title: action === 'block' ? 'Block this person?' : 'Remove this friend?',
      description:
        action === 'block'
          ? 'They won’t be able to send you direct messages. You can unblock them in Friends.'
          : 'You’ll need to become friends again to start a new conversation.',
      label: action === 'block' ? 'Block person' : 'Remove friend',
      run: async () => {
        await api(`/friends/${id}`, {
          method: action === 'remove' ? 'DELETE' : 'PATCH',
          body: { action },
        });
        await directory.refresh();
        setSelectedId(null);
        setDetails(false);
      },
    });
  }
  function leave() {
    setConfirm({
      title: 'Leave this group?',
      description: 'You’ll no longer be able to view or send messages in this group.',
      label: 'Leave group',
      run: async () => {
        await api(`/conversations/${selectedId}/leave`, { method: 'POST', body: {} });
        await directory.refreshConversations();
        setSelectedId(null);
        setDetails(false);
      },
    });
  }
  async function confirmAction() {
    setConfirmBusy(true);
    try {
      await confirm.run();
      setConfirm(null);
    } catch (error) {
      reportError(error.message);
    } finally {
      setConfirmBusy(false);
    }
  }
  return (
    <main
      className={`workspace ${selectedId && chatPage ? 'mobile-chat-open' : ''}`}
      data-theme={user.preferences?.theme || 'light'}
    >
      <Navigation
        view={view}
        onView={changeView}
        user={user}
        requestCount={directory.friends.filter((f) => f.status === 'pending' && f.incoming).length}
        groupInviteCount={groupInvitations.invitations.length}
        onLogout={() => onLogout().catch((error) => reportError(error.message))}
      />
      {chatPage ? (
        <>
          <ConversationList
            conversations={directory.conversations}
            selectedId={selectedId}
            onSelect={select}
            onNew={() => setModal('direct')}
            online={realtime.online}
            user={user}
            archived={view === 'archive'}
            loading={directory.loading}
            connected={realtime.connected}
          />
          <ChatView
            conversation={active}
            user={user}
            messagesState={messageState}
            realtime={realtime}
            reportError={reportError}
            onBack={() => {
              setSelectedId(null);
              setDetails(false);
            }}
            onInfo={() => setDetails(!details)}
            onFlag={flag}
          />
          {details && active && (
            <ConversationDetails
              conversation={active}
              user={user}
              friends={directory.friends}
              onClose={() => setDetails(false)}
              onLeave={leave}
              onRelationship={relationship}
              onManageGroup={() => setManageGroup(true)}
              onFlag={flag}
            />
          )}
        </>
      ) : view === 'friends' ? (
        <FriendsView
          friends={directory.friends}
          refresh={directory.refreshFriends}
          onChat={startChat}
          reportError={reportError}
        />
      ) : view === 'groups' ? (
        <GroupsView
          conversations={directory.conversations}
          onCreate={() => setModal('group')}
          onSelect={select}
          invitations={groupInvitations.invitations}
          invitationBusy={groupInvitations.busy}
          onRespond={(id, action) => groupInvitations.respond(id, action, created)}
        />
      ) : (
        <SettingsView
          user={user}
          onUpdated={onUpdated}
          onPasswordChanged={onPasswordChanged}
          onLogout={() => onLogout().catch((error) => reportError(error.message))}
          reportError={reportError}
        />
      )}
      {modal && (
        <NewConversation
          friends={directory.friends}
          initialGroup={modal === 'group'}
          onClose={() => setModal(null)}
          onCreated={created}
          onFindPeople={() => changeView('friends')}
        />
      )}
      {confirm && (
        <Modal
          title={confirm.title}
          description={confirm.description}
          onClose={() => {
            if (!confirmBusy) setConfirm(null);
          }}
        >
          <div className="modal-actions">
            <button
              className="secondary-button"
              disabled={confirmBusy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button className="danger-button" disabled={confirmBusy} onClick={confirmAction}>
              {confirmBusy ? 'One moment…' : confirm.label}
            </button>
          </div>
        </Modal>
      )}
      {manageGroup && active?.kind === 'group' && (
        <GroupSettings
          group={active}
          user={user}
          friends={directory.friends}
          onUpdated={directory.refreshConversations}
          invitationsVersion={groupInvitations.version}
          onClose={() => setManageGroup(false)}
        />
      )}
      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setError('')}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </main>
  );
}
