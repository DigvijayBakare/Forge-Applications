import React, {useEffect, useState} from 'react';
import {invoke} from '@forge/bridge';

function App() {
    const [data, setData] = useState(null);
    const [data2, setData2] = useState(null);
    const [input, setInput] = useState('');
    const [savedValue, setSavedValue] = useState('');
    const [users, setUsers] = useState([]);
    const [me, setMe] = useState([]);
    const [activeTab, setActiveTab] = useState('current-user-info');

    // All users
    const [allUsers, setAllUsers] = useState(null);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Selected user + groups
    const [selectedUser, setSelectedUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [confirmation, setConfirmation] = useState('');

    // Saved data
    const [saved, setSaved] = useState(null);

    // setData("Testing");

    useEffect(async () => {
        console.log('useeffectass');
        invoke('getText', {example: 'my-invoke-variable'}).then(setData);
        invoke('getText2', {example: 'my-invoke-variable'}).then(setData2);
        invoke('loadInput').then((val) => setSavedValue(val || ''));

        invoke('fetchUsers').then((val) => setAllUsers(val || []));

        const result = await invoke('userDetails', {example: 'my-invoke-variable'});
        console.log(result);
        setUsers(result.response);
        setMe(result);

        const loadUsers = async () => {
            setLoadingUsers(true);
            const res = await invoke('fetchUsers', {startAt: 0, maxResults: 50});
            setAllUsers(res);
            setLoadingUsers(false);
        };
        loadUsers();

    }, []);

    const onSubmit = async () => {
        await invoke('saveInput', {value: input});
        const latest = await invoke('loadInput');
        setSavedValue(latest || '');
        setInput('');
    };

    // Handle selecting a user
    const onSelectUser = async (accountId) => {
        if (!accountId) return;
        const user = allUsers.users.find(u => u.accountId === accountId);
        setSelectedUser(user);
        setGroups([]);
        setConfirmation('');

        const res = await invoke('fetchUserGroups', {
            accountId,
            displayName: user.displayName,
        });
        if (res.groups) setGroups(res.groups);
        if (res.saved) setConfirmation('Groups saved to Forge storage!');
    };

    // Handle show saved
    const onShowSaved = async () => {
        const res = await invoke('getSavedUsersGroups');
        setSaved(res);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: 420,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                /*padding: 24,*/
                fontFamily: 'Inter, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                color: '#172B4D'/*, overflow: 'hidden'*/
            }}>

                {/* Tabs Header */}
                <div style={{display: 'flex', borderBottom: '2px solid #DFE1E6'}}>
                    <button
                        onClick={() => setActiveTab('current-user-info')}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: activeTab === 'current-user-info' ? '#0052CC' : 'transparent',
                            color: activeTab === 'current-user-info' ? '#fff' : '#42526E',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 150ms ease'
                        }}
                    >
                        Current user info
                    </button>
                    <button
                        onClick={() => setActiveTab('user-groups')}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: activeTab === 'user-groups' ? '#0052CC' : 'transparent',
                            color: activeTab === 'user-groups' ? '#fff' : '#42526E',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 150ms ease'
                        }}> User groups
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{padding: 24}}>
                    {/* User Groups Tab Content */}
                    {activeTab === 'current-user-info' && (
                        <>
                            <h2 style={{margin: '0 0 16px', fontSize: 20, fontWeight: 600}}>Enter name</h2>
                            <input
                                id="name-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                type="text"
                                placeholder="Enter your name"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 4,
                                    border: '1px solid #DFE1E6',
                                    outline: 'none',
                                    fontSize: 14,
                                    transition: 'border-color 120ms ease',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                onClick={onSubmit}
                                disabled={!input.trim()}
                                style={{
                                    marginTop: 12,
                                    padding: '8px 14px',
                                    background: input.trim() ? '#0052CC' : '#A5ADBA',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                                    fontSize: 14
                                }}
                            > Save
                            </button>

                            <div style={{marginTop: 20, paddingTop: 12, borderTop: '1px solid #EBECF0'}}>
                                <h4 style={{margin: '0 0 6px', fontSize: 14, color: '#6B778C'}}>Saved value</h4>
                                <div
                                    style={{padding: '8px 10px', background: '#F4F5F7', borderRadius: 4, fontSize: 14}}>
                                    {savedValue || 'Loading...'}
                                </div>
                            </div>

                            <div style={{marginTop: 20, paddingTop: 12, borderTop: '1px solid #EBECF0'}}>
                                <h4 style={{margin: '0 0 6px', fontSize: 14, color: '#6B778C'}}>Logged-in user</h4>
                                {!users ? (
                                    <div style={{
                                        padding: '8px 10px',
                                        background: '#F4F5F7',
                                        borderRadius: 4,
                                        fontSize: 14
                                    }}>
                                        Loading...
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '120px 1fr',
                                        gap: '6px 10px',
                                        fontSize: 14
                                    }}>
                                        <div style={{color: '#6B778C'}}>Display name</div>
                                        <div>{users.displayName}</div>

                                        <div style={{color: '#6B778C'}}>Email</div>
                                        <div>{users.emailAddress || 'Hidden by privacy'}</div>

                                        <div style={{color: '#6B778C'}}>Time zone</div>
                                        <div>{users.timeZone}</div>
                                    </div>
                                )}
                                <div style={{marginTop: 20, paddingTop: 12, borderTop: '1px solid #EBECF0'}}>
                                    <h4 style={{margin: '0 0 6px', fontSize: 14, color: '#6B778C'}}>Groups</h4>
                                    {!me?.groups?.length ? (
                                        <div style={{
                                            padding: '8px 10px',
                                            background: '#F4F5F7',
                                            borderRadius: 4,
                                            fontSize: 14
                                        }}>
                                            None
                                        </div>
                                    ) : (
                                        <ul style={{margin: 0, paddingLeft: 18}}>
                                            {me.groups.map(g => (
                                                <li key={g.groupId || g.name}>
                                                    {g.name || g.displayName || '(unnamed group)'}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    {/* User Groups Tab */}
                    {activeTab === 'user-groups' && (
                        <div>
                            <h2 style={{margin: '0 0 16px', fontSize: 20, fontWeight: 600}}>User & Groups Explorer</h2>

                            {/* Dropdown */}
                            {loadingUsers ? (
                                <div>Loading users...</div>
                            ) : allUsers && allUsers.users ? (
                                <select
                                    style={{width: '100%', padding: 8, marginBottom: 16}}
                                    onChange={(e) => onSelectUser(e.target.value)}
                                >
                                    <option value="">-- Choose user --</option>
                                    {allUsers.users.map(u => (
                                        <option key={u.accountId} value={u.accountId}>
                                            {u.displayName} {u.emailAddress ? `(${u.emailAddress})` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div>No users found</div>
                            )}

                            {/* Confirmation */}
                            {confirmation && (
                                <div style={{color: 'green', marginBottom: 12}}>{confirmation}</div>
                            )}

                            {/* Groups list */}
                            {groups && groups.length > 0 && (
                                <div>
                                    <h4>Groups:</h4>
                                    <ul>
                                        {groups.map(g => (
                                            <li key={g.name}>{g.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Show saved */}
                            <button onClick={onShowSaved} style={{marginTop: 16}}>
                                Show Saved Users & Groups
                            </button>

                            {saved && (
                                <div style={{marginTop: 16}}>
                                    <h4>Saved Data:</h4>
                                    {Object.values(saved).map(entry => (
                                        <div key={entry.accountId} style={{marginBottom: 12}}>
                                            <strong>{entry.displayName}</strong>
                                            <ul>
                                                {entry.groups.map(g => (
                                                    <li key={g.name}>{g.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;