import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import EventFormModal from './components/EventFormModal';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LiveAttendancePage from './pages/LiveAttendancePage';
import AuditLogsPage from './pages/AuditLogsPage';
import StudentAttendancePage from './pages/StudentAttendancePage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
        Loading Attend | CSI Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // State for Event Form Modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const isPublicPage = location.pathname.startsWith('/attendance/session/') || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Show Navbar on Protected Admin Routes */}
      {!isPublicPage && isAuthenticated && <Navbar />}

      <div className="flex-1 flex overflow-hidden">
        
        {/* Show Sidebar on Protected Admin Routes */}
        {!isPublicPage && isAuthenticated && (
          <Sidebar onOpenCreateEvent={handleOpenCreateEvent} />
        )}

        {/* Main Content Viewport */}
        <main className={`flex-1 overflow-y-auto ${!isPublicPage && isAuthenticated ? 'p-4 lg:p-8' : ''}`}>
          <Routes>
            
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/attendance/session/:sessionId" element={<StudentAttendancePage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage onOpenCreateEvent={handleOpenCreateEvent} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage
                    onOpenCreateEvent={handleOpenCreateEvent}
                    onEditEvent={handleOpenEditEvent}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/events/:eventId"
              element={
                <ProtectedRoute>
                  <EventDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/live-monitor"
              element={
                <ProtectedRoute>
                  <LiveAttendancePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </main>
      </div>

      {/* Global Event Create / Edit Modal */}
      {showEventModal && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setShowEventModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

    </div>
  );
}
