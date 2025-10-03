import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { view } from '@forge/bridge';
import App from './App';
import UserIssuesPage from './UserIssuesPage';
import '@atlaskit/css-reset';

function AppRouter() {
    const [currentPage, setCurrentPage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get the module key from Forge context
        view.getContext()
            .then(context => {
                console.log('Forge context:', context);
                const moduleKey = context.moduleKey;
                console.log('Module key:', moduleKey);

                if (moduleKey === 'user-assigned-issues-page') {
                    setCurrentPage('user-issues');
                } else {
                    setCurrentPage('admin');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to get context:', err);
                // Default to admin page if context fails
                setCurrentPage('admin');
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ padding: 24, fontFamily: 'Inter, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
                Loading...
            </div>
        );
    }

    return currentPage === 'user-issues' ? <UserIssuesPage /> : <App />;
}

ReactDOM.render(<AppRouter />, document.getElementById('root'));