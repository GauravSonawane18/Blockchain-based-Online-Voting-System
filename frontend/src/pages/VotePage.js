import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionAPI, candidateAPI, voteAPI } from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, ShieldCheck } from 'lucide-react';

export default function VotePage() {
  const { electionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    // Admins are never allowed to vote
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.role === 'ADMIN') { navigate('/elections'); return; }

    const fetchData = async () => {
      try {
        const [elRes, candRes, votedRes] = await Promise.all([
          electionAPI.getById(electionId),
          candidateAPI.getByElection(electionId),
          voteAPI.hasVoted(electionId).catch(() => ({ data: { hasVoted: false } })),
        ]);
        setElection(elRes.data);
        setCandidates(candRes.data || []);
        setHasVoted(votedRes.data?.hasVoted || false);
      } catch (err) {
        toast.error('Failed to load election data');
        navigate('/elections');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [electionId, navigate]);

  const handleVote = async () => {
    if (!selectedCandidate) return;
    setSubmitting(true);
    try {
      await voteAPI.castVote(Number(electionId), selectedCandidate.id);
      setVoteSuccess(true);
      setHasVoted(true);
      setShowConfirm(false);
      toast.success('Vote cast successfully! Recorded on blockchain.', { duration: 5000 });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cast vote';
      toast.error(msg, { duration: 6000 });
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="fade-in"><p className="text-muted">Loading election...</p></div>;

  if (!election) return null;

  if (election.status !== 'ACTIVE') {
    return (
      <div className="fade-in">
        <div className="page-header"><h1>{election.title}</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="text-muted">This election is not currently active.</p>
        </div>
      </div>
    );
  }

  if (voteSuccess || hasVoted) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1>{election.title}</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>
          <CheckCircle size={60} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Vote Successfully Cast!</h2>
          <p className="text-muted" style={{ marginBottom: 20 }}>
            Your vote has been anonymously recorded on the blockchain.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/elections')}>
              Back to Elections
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/results/${electionId}`)}>
              View Live Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>{election.title}</h1>
        {election.description && <p className="text-muted">{election.description}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 16px', background: 'rgba(0,200,100,0.08)', borderRadius: 8, border: '1px solid rgba(0,200,100,0.2)' }}>
        <ShieldCheck size={16} color="var(--accent)" />
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>
          Your vote is anonymous and will be recorded immutably on the blockchain. You can only vote once.
        </span>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 14, color: 'var(--text2)' }}>
        SELECT A CANDIDATE — {candidates.length} candidates
      </h3>

      {candidates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 30 }}>
          <p className="text-muted">No candidates available for this election.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {candidates.map((c, idx) => {
            const isSelected = selectedCandidate?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCandidate(c)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected ? 'rgba(0,255,136,0.06)' : 'var(--bg2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: isSelected ? 'var(--accent)' : 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14,
                  color: isSelected ? '#000' : 'var(--text2)',
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  {c.party && <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 2 }}>{c.party}</div>}
                  {c.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{c.description}</div>}
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  flexShrink: 0,
                }} />
              </div>
            );
          })}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={() => setShowConfirm(true)}
        disabled={!selectedCandidate}
        style={{ padding: '12px 28px', fontSize: 15, opacity: selectedCandidate ? 1 : 0.5 }}
      >
        🗳 Submit Vote
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <ShieldCheck size={40} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ marginBottom: 8 }}>Confirm Your Vote</h3>
            <p className="text-muted" style={{ marginBottom: 16 }}>
              You are voting for:
            </p>
            <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedCandidate?.name}</div>
              {selectedCandidate?.party && (
                <div style={{ fontSize: 13, color: 'var(--accent2)' }}>{selectedCandidate.party}</div>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
              ⚠️ This action is irreversible. Once submitted, your vote cannot be changed.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleVote} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}