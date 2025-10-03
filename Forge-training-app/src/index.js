import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';
import api, { route } from "@forge/api";

const resolver = new Resolver();

resolver.define('getText', async (req) => {
    console.log(req);
    await kvs.set('test', 'Hello world');
    return 'Hello world! This is my first Forge App';
});

resolver.define('getText2', async (req) => {
    console.log(req);
    const test = await kvs.get('test');
    console.log(test);
    return 'Hello world2! This is my first Forge App';
});

// Save the input value in KVS
resolver.define('saveInput', async (req) => {
    const { value } = req.payload || {};
    await kvs.set('userInput', value || '');
    return { ok: true };
});

// Load the stored input value from KVS
resolver.define('loadInput', async () => {
    const val = await kvs.get('userInput');
    return val || '';
});

// Load user data from Jira
resolver.define('userDetails', async (req) => {
    const response = await api.asUser().requestJira(route`/rest/api/3/myself`, {
        headers: {'Accept': 'application/json'}
    });

    const status = response.status
    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(response);
    const me = await response.json();
    const groupsRes = await api.asUser().requestJira(
        route`/rest/api/3/user/groups?accountId=${me.accountId}`, {
            headers: {'Accept': 'application/json'}
        }
    );
    const groups = await groupsRes.json();
    console.log(groups);
    return { status: status, response: me, groups: groups };
});

// New: Fetch issues assigned to the current user with pagination support
resolver.define('fetchAssignedIssues', async (req) => {
    try {
        console.log('=== fetchAssignedIssues START ===');
        console.log('Payload:', req.payload);

        const { startAt = 0, maxResults = 10 } = req.payload || {};
        const projectKey = req.context?.extension?.project?.key;

        console.log('Project key:', projectKey, 'startAt:', startAt, 'maxResults:', maxResults);

        // Build JQL
        let jql;
        if (projectKey) {
            jql = `project = "${projectKey}" AND assignee = currentUser() ORDER BY updated DESC`;
        } else {
            jql = `assignee = currentUser() ORDER BY updated DESC`;
        }

        console.log('Using JQL:', jql);

        // Build request body according to the new API spec
        const requestBody = {
            jql: jql,
            maxResults: maxResults,
            fields: ['summary', 'updated', 'status']
        };

        if (startAt > 0) {
            console.log('Using offset pagination with old endpoint');
            const response = await api.asUser().requestJira(
                route`/rest/api/2/search`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        jql: jql,
                        startAt: startAt,
                        maxResults: maxResults,
                        fields: ['summary', 'updated', 'status']
                    })
                }
            );

            console.log('Response status:', response.status);
            const data = await response.json();

            if (!response.ok) {
                console.error('Jira API error:', response.status, data);
                return {
                    issues: [],
                    total: 0,
                    error: data?.errorMessages?.join(', ') || `Status ${response.status}`,
                    status: response.status
                };
            }

            const issues = (data.issues || []).map(i => ({
                key: i.key,
                summary: i.fields?.summary || '',
                updated: i.fields?.updated || null
            }));

            console.log('✅ SUCCESS - Returning', issues.length, 'issues');
            return {
                issues,
                total: data.total || 0,
                status: 200
            };
        }

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await api.asUser().requestJira(
            route`/rest/api/3/search/jql`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        console.log('Response status:', response.status, response.statusText);

        const text = await response.text();
        console.log('Response length:', text?.length);

        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            console.error('JSON parse error:', err);
            return {
                issues: [],
                total: 0,
                error: 'Invalid JSON response from Jira',
                status: response.status
            };
        }

        if (!response.ok) {
            console.error('Jira API error:', response.status, data);
            return {
                issues: [],
                total: 0,
                error: data?.errorMessages?.join(', ') || data?.errors || `Status ${response.status}`,
                status: response.status
            };
        }

        console.log('✅ SUCCESS - Total issues:', data.total);
        console.log('Issues in batch:', data.issues?.length);

        if (data.issues && data.issues.length > 0) {
            console.log('First issue:', data.issues[0].key, '-', data.issues[0].fields?.summary);
        }

        // Map issues
        const issues = (data.issues || []).map(i => ({
            key: i.key,
            summary: i.fields?.summary || '',
            updated: i.fields?.updated || null
        }));

        console.log('Returning', issues.length, 'issues');
        console.log('=== fetchAssignedIssues END ===');

        return {
            issues,
            total: data.total || 0,
            status: 200
        };

    } catch (err) {
        console.error('❌ EXCEPTION:', err.message);
        console.error('Stack:', err.stack);
        return {
            issues: [],
            total: 0,
            error: err.message || String(err),
            status: 500
        };
    }
});

resolver.define('fetchUsers', async (req) => {
    try {
        console.log('=== fetchUser START ===');
        const { startAt = 0, maxResults = 10, query = '' } = req.payload || {};

        const response = await api.asUser().requestJira(
            route`/rest/api/3/users/search?startAt=${startAt}&maxResults=${maxResults}&query=${encodeURIComponent(query)}`,
            { headers: { 'Accept': 'application/json' } });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error fetching users:', response.status, errorText);
            return {users: [], startAt: 0, maxResults: 0, isLast: true};
        }

        const data = await response.json();
        console.log('Total users received:', data.length);

        // Filter out bots, apps, and system accounts
        const realUsers = data.filter(user => {
            const isRealUser = user.accountType === 'atlassian';

            if (!isRealUser) {
                console.log('Filtered out:', user.displayName, 'accountType:', user.accountType);
            }

            return isRealUser;
        });

        console.log('Real users count:', realUsers.length);
        console.log('=== fetchUser END ===');

        return {
            users: realUsers,
            // users: data,
            startAt,
            maxResults,
            isLast: data.length < maxResults
        };
    } catch (err) {
        console.error('fetchUsers resolver error', err);
        return { users: [], error: err.message, status: 500 };
    }
});

// Fetch groups for a given user + save in storage
resolver.define('fetchUserGroups', async (req) => {
    try {
        const { accountId, displayName } = req.payload || {};
        if (!accountId) return { groups: [], error: 'accountId required' };

        const res = await api.asUser().requestJira(
            route`/rest/api/3/user/groups?accountId=${accountId}`,
            { headers: { Accept: 'application/json' } }
        );
        const text = await res.text();
        if (!res.ok) return { groups: [], error: text };

        const groups = JSON.parse(text);

        // Save in kvs under one object
        const key = 'savedUsersGroups';
        const existing = (await kvs.get(key)) || {};
        existing[accountId] = {
            accountId,
            displayName,
            groups,
            savedAt: new Date().toISOString(),
        };
        await kvs.set(key, existing);

        return { groups, saved: true };
    } catch (err) {
        console.error('fetchUserGroups error', err);
        return { groups: [], error: err.message };
    }
});

// Retrieve saved users + groups
resolver.define('getSavedUsersGroups', async () => {
    try {
        const saved = (await kvs.get('savedUsersGroups')) || {};
        return saved;
    } catch (err) {
        console.error('getSavedUsersGroups error', err);
        return {};
    }
});


export const handler = resolver.getDefinitions();