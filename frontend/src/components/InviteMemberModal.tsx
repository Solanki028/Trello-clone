import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { boardAPI, invitationAPI } from '../services/api';
import { Board, Invitation } from '../types';

interface InviteMemberModalProps {
  boardId: string;
  onClose: () => void;
  onMemberAdded: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  boardId,
  onClose,
  onMemberAdded,
}) => {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'invite'>('members');

  const fetchBoardData = useCallback(async () => {
    try {
      // Only fetch board data if user is likely a member (board owner or accepted member)
      const [boardData, invitationsData] = await Promise.allSettled([
        boardAPI.getBoard(boardId),
        invitationAPI.getBoardInvitations(boardId),
      ]);

      // Handle board data fetch (might fail if user is not a member yet)
      if (boardData.status === 'fulfilled') {
        setBoard(boardData.value);
      } else {
        // If board fetch fails, try to get just basic board info from invitation data
        // This handles the case where user is invited but hasn't accepted yet
        console.log('Board access denied (user not member yet):', boardData.reason);
      }

      // Handle invitation data fetch
      if (invitationsData.status === 'fulfilled') {
        setInvitations(invitationsData.value);
      } else {
        console.error('Failed to fetch invitations:', invitationsData.reason);
      }
    } catch (err) {
      console.error('Failed to fetch board data:', err);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await invitationAPI.sendInvitation(boardId, email, message);
      setSuccess(true);
      setEmail('');
      setMessage('');

      // Refresh invitations
      const updatedInvitations = await invitationAPI.getBoardInvitations(boardId);
      setInvitations(updatedInvitations);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send invitation';

      if (
        errorMessage.includes('24 hours') ||
        errorMessage.includes('2 minutes') ||
        errorMessage.includes('Please wait')
      ) {
        // Handle cooldown message specially
        const cooldownUntil = err.response?.data?.cooldownUntil;
        if (cooldownUntil) {
          const cooldownDate = new Date(cooldownUntil);
          const timeUntilCooldown = cooldownDate.getTime() - new Date().getTime();
          const minutesUntil = Math.ceil(timeUntilCooldown / (1000 * 60));
          const hoursUntil = Math.ceil(timeUntilCooldown / (1000 * 60 * 60));

          if (minutesUntil < 60) {
            setError(
              `Please wait ${Math.max(
                1,
                minutesUntil
              )} minute(s) before sending another invitation to this user.`
            );
          } else {
            setError(
              `Please wait ${hoursUntil} hour(s) before sending another invitation to this user.`
            );
          }
        } else {
          setError('Please wait before sending another invitation to this user.');
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await invitationAPI.cancelInvitation(invitationId);
      setInvitations(invitations.filter((inv) => inv._id !== invitationId));
      onMemberAdded(); // Refresh board data
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !window.confirm(`Are you sure you want to remove ${memberName} from this board?`)
    ) {
      return;
    }

    try {
      await boardAPI.removeMember(boardId, memberId);
      onMemberAdded(); // Refresh board data
      fetchBoardData(); // Refresh modal data
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Get owner and members from board with null safety
  const owner = board?.owner;
  const isCurrentUserOwner = user && owner && user._id === owner._id;
  const members =
    board?.members
      ?.filter((member) => {
        // Add null safety checks
        if (!member || !member.user || !owner) return false;
        return member.user._id !== owner._id;
      })
      .map((member) => member.user)
      .filter((user) => user !== null) || [];
  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  return (
    <div
      className="modal-overlay fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3"
      onClick={onClose}
    >
      <div
        className="
          modal-content
          w-full max-w-lg
          bg-slate-950/95
          text-slate-50
          rounded-2xl
          shadow-2xl shadow-black/80
          border border-white/10
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 text-lg">
                👥
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  Members &amp; Invitations
                </h3>
                <p className="text-xs text-slate-400">
                  Manage collaborators for this board
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 text-2xl leading-none w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-800/80 transition"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700 mb-4">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1 transition ${
                activeTab === 'members'
                  ? 'border-b-2 border-sky-400 text-sky-300'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <span>Members</span>
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1 transition ${
                activeTab === 'invite'
                  ? 'border-b-2 border-sky-400 text-sky-300'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <span>Invite</span>
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div
              className={`mb-4 p-3 border rounded-lg text-sm ${
                error.includes('24 hours') || error.includes('Please wait')
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                  : 'bg-red-950/70 border-red-500/70 text-red-200'
              }`}
            >
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/70 text-emerald-200 rounded-lg text-sm">
              Invitation sent successfully!
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {board ? (
                <>
                  {/* Owner */}
                  {owner && owner._id && owner.name && owner.email && (
                    <div className="border border-sky-600/40 rounded-xl p-3 bg-sky-900/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-sky-900/60">
                            {owner.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-50">
                              {owner.name}
                            </p>
                            <p className="text-xs text-slate-300">{owner.email}</p>
                          </div>
                        </div>
                        <span className="bg-sky-500 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-sm shadow-sky-900/60">
                          <span>👑</span>
                          <span>Admin</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Accepted Members */}
                  {members
                    .filter(
                      (member) =>
                        member && member._id && member.name && member.email
                    )
                    .map((member) => (
                      <div
                        key={member._id}
                        className="border border-slate-700 rounded-xl p-3 bg-slate-900/70"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-black/60">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-50">
                                {member.name}
                              </p>
                              <p className="text-xs text-slate-300">
                                {member.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/40">
                              <span>✓</span>
                              <span>Member</span>
                            </span>
                            {isCurrentUserOwner && (
                              <button
                                onClick={() =>
                                  handleRemoveMember(member._id, member.name)
                                }
                                className="text-xs font-medium px-2.5 py-1 rounded-lg border border-red-500/50 text-red-300 hover:bg-red-900/40 hover:text-red-100 transition"
                                title={`Remove ${member.name} from board`}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Pending Invitations */}
                  {pendingInvitations
                    .filter(
                      (invitation) =>
                        invitation &&
                        invitation._id &&
                        invitation.invitee &&
                        invitation.invitee._id &&
                        invitation.invitee.name &&
                        invitation.invitee.email
                    )
                    .map((invitation) => (
                      <div
                        key={invitation._id}
                        className="border border-amber-500/50 rounded-xl p-3 bg-amber-950/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {invitation.invitee.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-50">
                                {invitation.invitee.name}
                              </p>
                              <p className="text-xs text-slate-200">
                                {invitation.invitee.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/30 text-amber-100 px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border border-amber-400/60">
                              <span>⏳</span>
                              <span>Pending</span>
                            </span>
                            <button
                              onClick={() =>
                                handleCancelInvitation(invitation._id)
                              }
                              className="text-xs text-red-300 hover:text-red-100"
                              title="Cancel invitation"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        {invitation.message && (
                          <p className="text-xs text-amber-100 mt-2 italic">
                            "{invitation.message}"
                          </p>
                        )}
                      </div>
                    ))}

                  {members.length === 0 && pendingInvitations.length === 0 && (
                    <p className="text-slate-400 text-center py-4 text-sm">
                      No members yet. Start by sending an invitation!
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-sm">
                  <div className="text-slate-400 mb-2">
                    <p>Loading board information...</p>
                    <p className="text-xs mt-1">
                      If you're not a member yet, you won't be able to see board
                      details.
                    </p>
                  </div>
                  {pendingInvitations.length > 0 && (
                    <p className="text-sky-300 font-medium mt-2">
                      You have {pendingInvitations.length} pending invitation
                      {pendingInvitations.length > 1 ? 's' : ''}. Accept them to
                      join the board.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Invite Tab */}
          {activeTab === 'invite' && (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input bg-slate-900/80 border border-slate-700 text-slate-100 placeholder:text-slate-500"
                  placeholder="colleague@example.com"
                  required
                  disabled={isLoading}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The user must already have an account.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input bg-slate-900/80 border border-slate-700 text-slate-100 placeholder:text-slate-500"
                  placeholder="Add a message for the invitee..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary px-4 py-1.5 text-sm bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 border border-slate-600"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-1.5 text-sm bg-sky-500 hover:bg-sky-400 text-white font-semibold border-0 shadow-sm shadow-sky-900/60 disabled:opacity-60"
                  disabled={isLoading || !email}
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
