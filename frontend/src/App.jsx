import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MigrationWizard from './pages/MigrationWizard';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ViewExtraction from './pages/ViewExtraction';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [migrationSessionId, setMigrationSessionId] = useState(null);
  
  // Navigation states for inspecting extraction details
  const [viewingMigrationId, setViewingMigrationId] = useState(null);
  const [prevPage, setPrevPage] = useState('dashboard');

  // Authentication State (using localStorage to persist across refreshes)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('apexium_auth') === 'true';
  });
  const [loggedInUser, setLoggedInUser] = useState(() => {
    return localStorage.getItem('apexium_user') || '';
  });

  const handleLoginSuccess = (username) => {
    setIsAuthenticated(true);
    setLoggedInUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('apexium_auth');
    localStorage.removeItem('apexium_user');
    setIsAuthenticated(false);
    setLoggedInUser('');
    setCurrentPage('dashboard');
    setMigrationSessionId(null);
    setViewingMigrationId(null);
  };

  const handleSetCurrentPage = (page) => {
    // Clear session when moving elsewhere to avoid restoring stale sessions
    if (page !== 'wizard') {
      setMigrationSessionId(null);
    }
    setCurrentPage(page);
  };

  const handleViewExtraction = (id, fromPage) => {
    setViewingMigrationId(id);
    setPrevPage(fromPage);
    setCurrentPage('view-extraction');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            setCurrentPage={handleSetCurrentPage} 
            setMigrationSessionId={setMigrationSessionId} 
            onViewExtraction={handleViewExtraction}
          />
        );
      case 'wizard':
        return (
          <MigrationWizard 
            migrationSessionId={migrationSessionId} 
            setMigrationSessionId={setMigrationSessionId} 
            setCurrentPage={handleSetCurrentPage}
            onViewExtraction={handleViewExtraction}
          />
        );
      case 'logs':
        return (
          <Logs 
            setMigrationSessionId={setMigrationSessionId} 
            setCurrentPage={handleSetCurrentPage} 
            onViewExtraction={handleViewExtraction}
          />
        );
      case 'settings':
        return <Settings />;
      case 'view-extraction':
        return (
          <ViewExtraction 
            migrationId={viewingMigrationId} 
            onBack={() => handleSetCurrentPage(prevPage)} 
          />
        );
      default:
        return (
          <Dashboard 
            setCurrentPage={handleSetCurrentPage} 
            setMigrationSessionId={setMigrationSessionId} 
            onViewExtraction={handleViewExtraction}
          />
        );
    }
  };

  // If client operator is not authenticated, force login screen
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-900 overflow-hidden font-sans select-none">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={handleSetCurrentPage} 
      />

      {/* Primary Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Navy Header */}
        <Header 
          currentPage={currentPage} 
          setCurrentPage={handleSetCurrentPage} 
          loggedInUser={loggedInUser}
          onLogout={handleLogout}
        />

        {/* Page Canvas View */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

