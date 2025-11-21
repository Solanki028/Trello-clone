import React, { useState, useEffect } from 'react';
import { invitationAPI } from '../services/api';
import { Invitation } from '../types';

interface InvitationNotificationsProps {
  onInvitationAccepted: () => void;
}

const InvitationNotifications: React.FC<InvitationNotificationsProps> = ({ onInvitationAccepted }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
    // Refresh invitations every 30 seconds
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInvitations = async () => {
    try {
      const data = await invitationAPI.getUserInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setAcceptingId(invitationId);
    try {
      const result = await invitationAPI.acceptInvitation(invitationId);
      setInvitations(invitations.filter((inv) => inv._id !== invitationId));
      onInvitationAccepted();

      // Show success message
      alert(`Successfully joined "${result.board.title}"!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      await invitationAPI.declineInvitation(invitationId);
      setInvitations(invitations.filter((inv) => inv._id !== invitationId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline invitation');
    }
  };

  if (isLoading) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="text-xl">📬</span>
          <span>Pending Invitations</span>
        </h3>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
          {invitations.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation._id}
            className="
              bg-white
              border border-slate-200
              rounded-xl
              p-4
              shadow-sm
              hover:shadow-md
              transition-shadow
            "
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              {/* Left: Board info + message */}
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div
                    className="
                      w-12 h-12
                      rounded-xl
                      flex items-center justify-center
                      text-white font-semibold text-lg
                      shadow-sm
                      border border-white/70
                    "
                    style={{ backgroundColor: invitation.board.backgroundColor }}
                  >
                    {invitation.board.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">
                        {invitation.board.title}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        New invite
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Invited by{' '}
                      <span className="font-medium text-slate-800">
                        {invitation.inviter.name}
                      </span>
                    </p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mt-3">
                    <button
                      onClick={() =>
                        setExpandedNotification(
                          expandedNotification === invitation._id ? null : invitation._id
                        )
                      }
                      className="
                        text-xs
                        inline-flex items-center gap-1
                        text-sky-600 hover:text-sky-800
                        font-medium
                      "
                    >
                      <span>
                        {expandedNotification === invitation._id
                          ? 'Hide message'
                          : 'Show message'}
                      </span>
                      <span className="text-[10px]">
                        {expandedNotification === invitation._id ? '▲' : '▼'}
                      </span>
                    </button>

                    {expandedNotification === invitation._id && (
                      <div className="mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                        “{invitation.message}”
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex sm:flex-col gap-2 sm:ml-4 sm:w-36 justify-end sm:justify-start">
                <button
                  onClick={() => handleDecline(invitation._id)}
                  className="
                    px-3 py-1.5
                    text-sm
                    rounded-lg
                    border
                    border-slate-300
                    text-slate-600
                    hover:text-red-600
                    hover:border-red-200
                    bg-white
                    transition
                    disabled:opacity-60
                  "
                  disabled={acceptingId === invitation._id}
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAccept(invitation._id)}
                  className="
                    px-3 py-1.5
                    text-sm
                    rounded-lg
                    bg-emerald-500
                    text-white
                    font-medium
                    hover:bg-emerald-600
                    shadow-sm
                    shadow-emerald-900/40
                    transition
                    disabled:opacity-60
                    inline-flex items-center justify-center gap-1
                  "
                  disabled={acceptingId === invitation._id}
                >
                  {acceptingId === invitation._id ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    'Accept'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvitationNotifications;
