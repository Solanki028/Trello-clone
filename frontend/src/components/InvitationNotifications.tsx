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
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
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
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
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
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        📬 Pending Invitations ({invitations.length})
      </h3>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation._id}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
                    style={{ backgroundColor: invitation.board.backgroundColor }}
                  >
                    {invitation.board.title.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {invitation.board.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Invited by <span className="font-medium">{invitation.inviter.name}</span>
                    </p>
                  </div>
                </div>
                
                {invitation.message && (
                  <div className="mt-2">
                    <button
                      onClick={() => setExpandedNotification(
                        expandedNotification === invitation._id ? null : invitation._id
                      )}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {expandedNotification === invitation._id ? 'Hide message' : 'Show message'}
                    </button>
                    
                    {expandedNotification === invitation._id && (
                      <div className="mt-2 p-3 bg-white border border-blue-200 rounded text-sm text-gray-700">
                        "{invitation.message}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleDecline(invitation._id)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 rounded hover:border-red-300"
                  disabled={acceptingId === invitation._id}
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAccept(invitation._id)}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  disabled={acceptingId === invitation._id}
                >
                  {acceptingId === invitation._id ? 'Joining...' : 'Accept'}
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