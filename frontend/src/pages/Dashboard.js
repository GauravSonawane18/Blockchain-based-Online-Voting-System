import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionAPI, voteAPI } from '../api';
import { CheckSquare, BarChart2, List } from 'lucide-react';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const [myElections, setMyElections] = useState([]);
  const [activeElections, setActiveElections] = useState([]);
  const [votedMap, setVotedMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all active elections
        const activeRes = await electionAPI.getActive();
        setActiveElections(activeRes.data || []);

        if (!isAdmin) {
          // Get elections assigned to this voter
          const myRes = await electionAPI.getMyElections();
          const assigned = myRes.data || [];
          setMyElections(assigned);

          // Check voted status for each assigned active election
          const voted = {};
          for (const e of assigned) {
            const election = e.election || e;
            if (election.status === 'ACTIVE') {
              try {
                const r = await voteAPI.hasVoted(election.id);
                voted[election.id] = r.data?.hasVoted || false;
              } catch { voted[election.id] = false; }
            }
          }
          setVotedMap(voted);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (isAdmin) {
    window.location.href = '/admin';
    return null;
  }

  const assignedElections = myElections.map(e => e.election || e);
  const activeAssigned = assignedElections.filter(e => e.status === 'ACTIVE');
  const votesCast = Object.values(votedMap).filter(Boolean).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Welcome, {user.fullName?.split(' ')[0] || 'Voter'}</h1>
        <p className="text-muted">Your blockchain voting portal</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <CheckSquare size={24} color="var(--accent)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
            {activeElections.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Active Elections</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <BarChart2 size={24} color="#60a5fa" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#60a5fa' }}>
            {votesCast}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Votes Cast</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <List size={24} color="#a78bfa" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#a78bfa' }}>
            {assignedElections.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Total Assigned</div>
        </div>
      </div>

      {/* Your Elections */}
      <h2 style={{ fontSize: 16, marginBottom: 14, fontWeight: 700 }}>Your Elections</h2>
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : assignedElections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <CheckSquare size={40} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text2)' }}>No elections assigned yet.</p>
          <p className="text-muted text-sm">Contact an admin to be assigned to an election.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignedElections.map(el => {
            const hasVoted = votedMap[el.id];
            return (
              <div className="card" key={el.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15 }}>{el.title}</h3>
                    <span className={`badge ${el.status === 'ACTIVE' ? 'badge-green' : el.status === 'ENDED' ? 'badge-gray' : 'badge-blue'}`}>
                      {el.status}
                    </span>
                    {hasVoted && <span className="badge badge-green">✓ Voted</span>}
                  </div>
                  {el.description && <p style={{ fontSize: 12, color: 'var(--text2)' }}>{el.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {el.status === 'ACTIVE' && !hasVoted && (
                    <Link to={`/vote/${el.id}`} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
                      🗳 Cast Vote
                    </Link>
                  )}
                  {el.status === 'ACTIVE' && hasVoted && (
                    <Link to={`/results/${el.id}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                      View Results
                    </Link>
                  )}
                  {el.status === 'ENDED' && (
                    <Link to={`/results/${el.id}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                      View Results
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}