// src/panel/panel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import './panel.css'; // Make sure you have this CSS file

// Define a type for our stats object for better code quality
interface TrainingStats {
    total_untrained: number;
    untrained_productive: number;
    untrained_unproductive: number;
    last_trained: string | null;
}

// Define a type for the status message
interface StatusMessage {
    text: string;
    type: 'success' | 'error';
}

const Panel: React.FC = () => {
    // State to hold the stats from the API
    const [stats, setStats] = useState<TrainingStats | null>(null);
    // State to handle loading UI
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // State for the status message (e.g., "Retraining...")
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

    // Function to fetch stats, wrapped in useCallback for stability
    const fetchStats = useCallback(() => {
        setIsLoading(true);
        setStatusMessage(null);

        chrome.runtime.sendMessage({ action: 'getUntrainedStats' }, (response) => {
            if (response && response.success) {
                setStats(response.data);
            } else {
                setStatusMessage({
                    text: `Failed to load stats: ${response?.error || 'Unknown error'}`,
                    type: 'error',
                });
            }
            setIsLoading(false);
        });
    }, []);

    // Function to handle the "Retrain Model" button click
    const handleRetrain = () => {

        setIsLoading(true); // Disable buttons while retraining
        setStatusMessage({ text: 'Retraining in progress... this may take a moment.', type: 'success' });

        chrome.runtime.sendMessage({ action: 'retrainModel' }, (response) => {
            if (response && response.success) {
                setStatusMessage({
                    text: `Model retrained successfully! Version: ${response.data.model_version}`,
                    type: 'success',
                });
                // Refresh stats automatically after successful retraining
                fetchStats();
            } else {
                setStatusMessage({
                    text: `Error during retraining: ${response?.error || 'Unknown error'}`,
                    type: 'error',
                });
                 setIsLoading(false); // Re-enable buttons on failure
            }
        });
    };
    
    // useEffect hook to fetch data when the component first loads
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const renderStats = () => {
        if (!stats) {
            return <p>Loading stats...</p>;
        }
        return (
            <>
                <div className="stat-item">
                    <span>Total Untrained:</span>
                    <span>{stats.total_untrained}</span>
                </div>
                <div className="stat-item">
                    <span>Untrained Productive:</span>
                    <span>{stats.untrained_productive}</span>
                </div>
                <div className="stat-item">
                    <span>Untrained Unproductive:</span>
                    <span>{stats.untrained_unproductive}</span>
                </div>
                <div className="stat-item">
                    <span>Last Trained At:</span>
                    <span>{stats.last_trained ? new Date(stats.last_trained).toLocaleString() : 'Never'}</span>
                </div>
            </>
        );
    };

    return (
        <div className="container">
            <div className="stats">
                <h2>Model Training Stats</h2>
                {isLoading && !stats ? <p>Loading...</p> : renderStats()}
            </div>

            <div className="actions">
                <h2>Actions</h2>
                <button onClick={fetchStats} disabled={isLoading}>
                    Refresh Stats
                </button>
                <button 
                    onClick={handleRetrain} 
                    disabled={isLoading}
                    className="retrain-btn"
                >
                    Retrain Model
                </button>
                {statusMessage && (
                    <div id="status-message" className={`status-${statusMessage.type}`}>
                        {statusMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Panel;