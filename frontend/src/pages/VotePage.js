import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionAPI, candidateAPI, voteAPI } from '../api';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { Mail, Vote, CheckCircle, Shield, Loader } from 'lucide-react';

const CONTRACT_ABI = [
  "function castVote(uint256 _candidateId, bytes32 _nullifierHash) external",
  "event VoteCast(address indexed voter, uint256 indexed candidateId, bytes32 nullifierHash)"
];
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export default function VotePage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [step, setStep] = useState('otp'); // otp | select | voting | done
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [nullifier, setNullifier] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    electionAPI.getById(electionId).then(r => setElection(r.data));
    candidateAPI.getByElection(electionId).then(r => setCandidates(r.data));
    voteAPI.getStatus(electionId).then(r => { if (r.data.hasVoted) setStep('done'); });
  }, [electionId]);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await voteAPI.requestOtp(Number(electionId));
      setOtpSent(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await voteAPI.verifyOtp(Number(electionId), otp);
      setNullifier(res.data.nullifierHash);
      setStep('select');
      toast.success('OTP verified! Select your candidate.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const castVote = async () => {
    if (!selected) return toast.error('Please select a candidate');
    setStep('voting');
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      toast('Sending transaction...', { icon: '⛓️' });
      const tx = await contract.castVote(selected.candidateIdOnChain, nullifier);
      toast('Waiting for confirmation...', { icon: '⏳' });
      const receipt = await tx.wait();

      const res = await voteAPI.saveReceipt({
        electionId: Number(electionId),
        candidateId: selected.id,
        transactionHash: receipt.hash,
        nullifierHash: nullifier
      });
      setReceipt(res.data);
      setStep('done');
      toast.success('Vote recorded on blockchain!');
    } catch (err) {
      setStep('select');
      toast.error(err.reason || err.message || 'Transaction failed');
    } finally { setLoading(false); }
  };

  if (!election) return <p className="text-muted pulse">Loading...</p>;

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <h1>{election.title}</h1>
        <p className="text-muted">Blockchain-verified anonymous voting</p>
      </div>

      {/* Step: OTP */}
      {step === 'otp' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(0,136,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={20} color="var(--accent2)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16 }}>Step 1: Verify your identity</h3>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>An OTP will be sent to your registered email</p>
            </div>
          </div>
          {!otpSent ? (
            <button className="btn btn-primary" onClick={sendOtp} disabled={loading} style={{ alignSelf: 'flex-start' }}>
              <Mail size={14} /> {loading ? 'Sending...' : 'Send OTP to Email'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label>Enter OTP</label>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: 24, padding: '14px' }} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={verifyOtp} disabled={loading || otp.length < 6}>
                  {loading ? <Loader size={14} className="pulse" /> : <CheckCircle size={14} />} Verify OTP
                </button>
                <button className="btn btn-secondary" onClick={sendOtp} disabled={loading}>Resend</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Select */}
      {step === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--accent)' }}>
              <Shield size={14} /> Identity verified. Your vote will be anonymous on-chain.
            </div>
          </div>
          <h3 style={{ fontSize: 16 }}>Step 2: Select a candidate</h3>
          {candidates.map(c => (
            <div key={c.id} className="card" onClick={() => setSelected(c)}
              style={{ cursor: 'pointer', borderColor: selected?.id === c.id ? 'var(--accent)' : 'var(--border)', background: selected?.id === c.id ? 'rgba(0,255,136,0.05)' : 'var(--bg2)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: selected?.id === c.id ? 'var(--accent)' : 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)',
                color: selected?.id === c.id ? '#0a0a0f' : 'var(--text2)',
                transition: 'all 0.2s'
              }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                {c.party && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.party}</div>}
                {c.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{c.description}</div>}
              </div>
              {selected?.id === c.id && <CheckCircle size={20} color="var(--accent)" />}
            </div>
          ))}
          <button className="btn btn-primary" onClick={castVote} disabled={!selected} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            <Vote size={14} /> Cast Vote via MetaMask
          </button>
          <p style={{ fontSize: 11, color: 'var(--text3)' }}>Your wallet must be connected to Hardhat localhost network (Chain ID: 31337)</p>
        </div>
      )}

      {/* Step: Voting */}
      {step === 'voting' && (
        <div className="card text-center" style={{ padding: 60 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Loader size={28} color="var(--accent)" className="pulse" />
          </div>
          <h3 style={{ marginBottom: 8 }}>Processing Transaction</h3>
          <p className="text-muted text-sm">Submitting your vote to the blockchain...</p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="card" style={{ border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.03)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,255,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(0,255,136,0.2)' }}>
              <CheckCircle size={32} color="var(--accent)" />
            </div>
            <h2 style={{ color: 'var(--accent)', marginBottom: 8 }}>Vote Recorded!</h2>
            <p className="text-muted text-sm">Your vote is permanently stored on the blockchain.</p>
          </div>
          {receipt && (
            <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Candidate</span>
                <span style={{ fontWeight: 700 }}>{receipt.candidateName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">TX Hash</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent2)' }}>{receipt.transactionHash?.slice(0,20)}...</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Nullifier</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{receipt.nullifierHash?.slice(0,20)}...</span>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => navigate(`/results/${electionId}`)} style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
            View Results
          </button>
        </div>
      )}
    </div>
  );
}
