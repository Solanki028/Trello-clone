import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { boardAPI, invitationAPI } from '../services/api';
import { Board, Invitation } from '../types';

interface InviteMemberModalProps {
  boardId: string;
  onClose: () => void;
  onMemberAdded: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ boardId, onClose, onMemberAdded }) => {
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
        invitationAPI.getBoardInvitations(boardId)
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
      
      if (errorMessage.includes('24 hours') || errorMessage.includes('2 minutes') || errorMessage.includes('Please wait')) {
        // Handle cooldown message specially
        const cooldownUntil = err.response?.data?.cooldownUntil;
        if (cooldownUntil) {
          const cooldownDate = new Date(cooldownUntil);
          const timeUntilCooldown = cooldownDate.getTime() - new Date().getTime();
          const minutesUntil = Math.ceil(timeUntilCooldown / (1000 * 60));
          const hoursUntil = Math.ceil(timeUntilCooldown / (1000 * 60 * 60));
          
          if (minutesUntil < 60) {
            setError(`Please wait ${Math.max(1, minutesUntil)} minute(s) before sending another invitation to this user.`);
          } else {
            setError(`Please wait ${hoursUntil} hour(s) before sending another invitation to this user.`);
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
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      onMemberAdded(); // Refresh board data
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this board?`)) {
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
  const members = board?.members?.filter(member => {
    // Add null safety checks
    if (!member || !member.user || !owner) return false;
    return member.user._id !== owner._id;
  }).map(member => member.user).filter(user => user !== null) || [];
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Members & Invitations</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'members'
                  ? 'border-b-2 border-trello-blue text-trello-blue'
                  : 'text-gray-500'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'invite'
                  ? 'border-b-2 border-trello-blue text-trello-blue'
                  : 'text-gray-500'
              }`}
            >
              Invite
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-3 border rounded-lg text-sm ${
              error.includes('24 hours') || error.includes('Please wait')
                ? 'bg-orange-100 border-orange-400 text-orange-800'
                : 'bg-red-100 border-red-400 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
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
                    <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-trello-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {owner.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{owner.name}</p>
                            <p className="text-sm text-gray-500">{owner.email}</p>
                          </div>
                        </div>
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          👑 Admin
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Accepted Members */}
                  {members.filter(member => member && member._id && member.name && member.email).map((member) => (
                    <div key={member._id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            ✓ Member
                          </span>
                          {isCurrentUserOwner && (
                            <button
                              onClick={() => handleRemoveMember(member._id, member.name)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 border border-red-200 rounded hover:bg-red-50"
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
                  {pendingInvitations.filter(invitation => 
                    invitation && invitation._id && invitation.invitee && 
                    invitation.invitee._id && invitation.invitee.name && invitation.invitee.email
                  ).map((invitation) => (
                    <div key={invitation._id} className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {invitation.invitee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{invitation.invitee.name}</p>
                            <p className="text-sm text-gray-500">{invitation.invitee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            ⏳ Pending
                          </span>
                          <button
                            onClick={() => handleCancelInvitation(invitation._id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Cancel invitation"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      {invitation.message && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{invitation.message}"</p>
                      )}
                    </div>
                  ))}

                  {members.length === 0 && pendingInvitations.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No members yet. Start by sending an invitation!</p>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">
                    <p>Loading board information...</p>
                    <p className="text-sm">If you're not a member yet, you won't be able to see board details.</p>
                  </div>
                  {pendingInvitations.length > 0 && (
                    <p className="text-blue-600 font-medium">
                      You have {pendingInvitations.length} pending invitation(s). Accept them to join the board.
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="colleague@example.com"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The user must already have an account
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input"
                  placeholder="Add a message for the invitee..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
