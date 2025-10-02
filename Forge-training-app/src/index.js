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
    // return groupDetails;
    console.log(groups);
    // const resp = await response.json();
    return { status: status, response: me, groups: groups };

    /*return {
        accountId: me.accountId,
        displayName: me.displayName,
        emailAddress: me.emailAddress,
        timeZone: me.timeZone,
        locale: me.locale,
        groups // array
    };*/
});

export const handler = resolver.getDefinitions();