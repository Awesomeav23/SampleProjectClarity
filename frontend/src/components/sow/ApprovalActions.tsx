import { useState } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';

interface Props {
  onApprove: (comments?: string) => void;
  onReject: (comments: string) => void;
  loading?: boolean;
}

export default function ApprovalActions({ onApprove, onReject, loading }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [comments, setComments] = useState('');

  const handleReject = () => {
    if (!comments.trim()) return;
    onReject(comments);
    setComments('');
    setShowRejectForm(false);
  };

  return (
    <div className="space-y-3">
      {showRejectForm ? (
        <div className="space-y-3">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Explain why this SOW is being rejected (required)..."
            rows={3}
            className="w-full rounded-lg border-gray-300 text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading || !comments.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              <X size={16} />
              Confirm Rejection
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setComments(''); }}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove()}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Check size={16} />
            Approve
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50"
          >
            <X size={16} />
            Reject
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            title="Request Changes"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
