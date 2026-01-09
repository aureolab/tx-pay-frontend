import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { merchantsApi, transactionsApi, adminUsersApi, healthApi } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'merchants' | 'transactions' | 'admins'>('merchants');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    healthApi.check().then(res => setHealth(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'merchants') {
        const res = await merchantsApi.list();
        setMerchants(res.data);
      } else if (tab === 'transactions') {
        const res = await transactionsApi.list();
        setTransactions(Array.isArray(res.data) ? res.data : res.data.data || []);
      } else if (tab === 'admins') {
        const res = await adminUsersApi.list();
        setAdmins(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMerchant = async (id: string) => {
    if (!confirm('Delete this merchant?')) return;
    try {
      await merchantsApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleTransactionAction = async (id: string, action: 'capture' | 'refund' | 'void') => {
    try {
      if (action === 'capture') await transactionsApi.capture(id);
      else if (action === 'refund') await transactionsApi.refund(id);
      else if (action === 'void') await transactionsApi.void(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || `${action} failed`);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Tx Pay Admin</h1>
        <div style={styles.userInfo}>
          <span>{user?.full_name || user?.email}</span>
          <span style={styles.healthBadge}>
            DB: {health?.details?.database?.status || 'checking...'}
          </span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <nav style={styles.nav}>
        <button
          onClick={() => setTab('merchants')}
          style={{ ...styles.navBtn, ...(tab === 'merchants' ? styles.navBtnActive : {}) }}
        >
          Merchants
        </button>
        <button
          onClick={() => setTab('transactions')}
          style={{ ...styles.navBtn, ...(tab === 'transactions' ? styles.navBtnActive : {}) }}
        >
          Transactions
        </button>
        <button
          onClick={() => setTab('admins')}
          style={{ ...styles.navBtn, ...(tab === 'admins' ? styles.navBtnActive : {}) }}
        >
          Admin Users
        </button>
      </nav>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}
        {loading && <div style={styles.loading}>Loading...</div>}

        {!loading && tab === 'merchants' && (
          <div>
            <h2>Merchants ({merchants.length})</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Legal Name</th>
                  <th>Tax ID</th>
                  <th>Status</th>
                  <th>Payment Methods</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m._id}>
                    <td>{m.profile?.fantasy_name}</td>
                    <td>{m.profile?.legal_name}</td>
                    <td>{m.profile?.tax_id}</td>
                    <td>
                      <span style={{
                        ...styles.badge,
                        background: m.status === 'ACTIVE' ? '#4caf50' : '#ff9800'
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td>{m.enabled_payment_methods?.join(', ')}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteMerchant(m._id)}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {merchants.length === 0 && <p>No merchants found</p>}
          </div>
        )}

        {!loading && tab === 'transactions' && (
          <div>
            <h2>Transactions ({transactions.length})</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {t._id?.slice(-8)}
                    </td>
                    <td>{t.financials?.amount_gross?.toLocaleString()}</td>
                    <td>{t.financials?.currency}</td>
                    <td>
                      <span style={{
                        ...styles.badge,
                        background: t.status === 'CAPTURED' ? '#4caf50' :
                          t.status === 'PENDING' ? '#ff9800' :
                            t.status === 'REFUNDED' ? '#9c27b0' : '#999'
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.payment_method}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>
                      {t.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleTransactionAction(t._id, 'capture')} style={styles.actionBtn}>
                            Capture
                          </button>
                          <button onClick={() => handleTransactionAction(t._id, 'void')} style={styles.actionBtn}>
                            Void
                          </button>
                        </>
                      )}
                      {t.status === 'CAPTURED' && (
                        <button onClick={() => handleTransactionAction(t._id, 'refund')} style={styles.actionBtn}>
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p>No transactions found</p>}
          </div>
        )}

        {!loading && tab === 'admins' && (
          <div>
            <h2>Admin Users ({admins.length})</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a._id}>
                    <td>{a.full_name}</td>
                    <td>{a.email}</td>
                    <td>{a.roles?.join(', ')}</td>
                    <td>
                      <span style={{
                        ...styles.badge,
                        background: a.active ? '#4caf50' : '#f44336'
                      }}>
                        {a.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admins.length === 0 && <p>No admin users found</p>}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: '#1a1a2e',
    color: 'white',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    margin: 0,
    fontSize: '24px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  healthBadge: {
    background: '#4caf50',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid white',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  nav: {
    background: 'white',
    padding: '0 24px',
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #ddd',
  },
  navBtn: {
    padding: '16px 24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '3px solid transparent',
  },
  navBtnActive: {
    borderBottomColor: '#007bff',
    color: '#007bff',
    fontWeight: 'bold',
  },
  main: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  table: {
    width: '100%',
    background: 'white',
    borderCollapse: 'collapse',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  deleteBtn: {
    background: '#f44336',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  actionBtn: {
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '4px',
  },
};
