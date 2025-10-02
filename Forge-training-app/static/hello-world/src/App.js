import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

function App() {
    const [data, setData] = useState(null);
    const [data2, setData2] = useState(null);
    const [input, setInput] = useState('');
    const [savedValue, setSavedValue] = useState('');
    const [users, setUsers] = useState([]);
    const [me, setMe] = useState([])

    // setData("Testing");

    useEffect(async () => {
        console.log('useeffectass');
        invoke('getText', { example: 'my-invoke-variable' }).then(setData);
        invoke('getText2', { example: 'my-invoke-variable' }).then(setData2);
        invoke('loadInput').then((val) => setSavedValue(val || ''));

        const result = await invoke('userDetails', { example: 'my-invoke-variable' });
        console.log(result);
        setUsers(result.response);
        setMe(result);
    }, []);

    const onSubmit = async () => {
        await invoke('saveInput', { value: input });
        const latest = await invoke('loadInput');
        setSavedValue(latest || '');
        setInput('');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 420, background: '#fff', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                padding: 24, fontFamily: 'Inter, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', color: '#172B4D'}}>

                <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600 }}>Enter name</h2>
                <input
                    id="name-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    type="text"
                    placeholder="Enter your name"
                    style={{width: '100%', padding: '10px 12px', borderRadius: 4, border: '1px solid #DFE1E6', outline: 'none',
                        fontSize: 14, transition: 'border-color 120ms ease', boxSizing: 'border-box'
                    }}
                />
                <button
                    onClick={onSubmit}
                    disabled={!input.trim()}
                    style={{marginTop: 12, padding: '8px 14px', background: input.trim() ? '#0052CC' : '#A5ADBA', color: '#fff',
                        border: 'none', borderRadius: 4, cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: 14
                    }}
                > Save </button>

                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #EBECF0' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#6B778C' }}>Saved value</h4>
                    <div style={{ padding: '8px 10px', background: '#F4F5F7', borderRadius: 4, fontSize: 14}}>
                        {savedValue || 'Loading...'}
                    </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #EBECF0' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#6B778C' }}>Logged-in user</h4>
                    {!users ? (
                        <div style={{ padding: '8px 10px', background: '#F4F5F7', borderRadius: 4, fontSize: 14}}>
                            Loading...
                        </div>
                        ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 10px', fontSize: 14 }}>
                            <div style={{ color: '#6B778C' }}>Display name</div>
                            <div>{users.displayName}</div>

                            <div style={{ color: '#6B778C' }}>Email</div>
                            <div>{users.emailAddress || 'Hidden by privacy'}</div>

                            <div style={{ color: '#6B778C' }}>Time zone</div>
                            <div>{users.timeZone}</div>
                        </div>
                    )}
                    <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #EBECF0' }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#6B778C' }}>Groups</h4>
                        {!me?.groups?.length ? (
                            <div style={{ padding: '8px 10px', background: '#F4F5F7', borderRadius: 4, fontSize: 14 }}>
                                None
                            </div>
                        ) : (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {me.groups.map(g => (
                                    <li key={g.groupId || g.name}>
                                        {g.name || g.displayName || '(unnamed group)'}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
