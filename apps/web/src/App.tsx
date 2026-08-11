import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BoardView } from './components/board/BoardView';
import { MasterDashboard } from './components/dashboard/MasterDashboard';
import { AutomationEditorModal } from './components/automation/AutomationEditorModal';
import { MeetingsView } from './components/meetings/MeetingsView';
import { UsersView } from './components/users/UsersView';
import { OkrsView } from './components/okrs/OkrsView';
import { LoginPage } from './components/auth/LoginPage';
import { Board, User, Item } from './types';
import { api } from './services/api';
import { useBoardStore } from './hooks/useBoardStore';

function MainAppContent() {
  const { currentUser, theme, toggleTheme, logout, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = useState<User[]>([]);
  const [isAutomationsModalOpen, setIsAutomationsModalOpen] = useState(false);

  const {
    boards,
    activeBoard,
    loading,
    fetchBoards,
    fetchBoard,
    setActiveBoard,
    updateItemStatusOptimistic,
    updateItemAssigneeOptimistic,
    addItem,
    addGroup,
  } = useBoardStore(null);

  // Extract board ID from current location path /board/:id
  const getBoardIdFromPath = (path: string): string | null => {
    const match = path.match(/\/board\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  const loadInitialData = async () => {
    const validBoards = await fetchBoards();
    try {
      const userList = await api.getUsers();
      const validUsers = Array.isArray(userList) ? userList : [];
      setUsers(validUsers);

      if (currentUser) {
        const freshSelf = validUsers.find((u) => u.id === currentUser.id);
        if (freshSelf) {
          setCurrentUser(freshSelf);
          localStorage.setItem('monday_m365_user', JSON.stringify(freshSelf));
        }
      }

      const pathBoardId = getBoardIdFromPath(location.pathname);
      const targetBoardId = pathBoardId || (validBoards.length > 0 ? validBoards[0].id : null);

      if (targetBoardId) {
        await fetchBoard(targetBoardId);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser?.id]);

  const handleSelectBoard = async (boardId: string) => {
    await fetchBoard(boardId);
    navigate(`/board/${boardId}`);
  };

  const handleCreateBoard = async () => {
    if (!currentUser) return;
    const title = prompt('Nombre del nuevo tablero:') || 'Nuevo Tablero de Proyectos';
    const newBoard = await api.createBoard({
      title,
      createdById: currentUser.id,
    });
    await fetchBoards();
    if (newBoard && newBoard.id) handleSelectBoard(newBoard.id);
  };

  const handleEditBoard = async (boardId: string, title: string, description: string) => {
    await api.updateBoard(boardId, { title, description });
    await fetchBoards();
    handleSelectBoard(boardId);
  };

  const handleDeleteBoard = async (boardId: string) => {
    await api.deleteBoard(boardId);
    const validBoards = await fetchBoards();
    if (validBoards.length > 0) {
      handleSelectBoard(validBoards[0].id);
    } else {
      setActiveBoard(null);
    }
  };

  const handleSyncCalendar = async (item: Item) => {
    const result = await api.syncOutlookCalendar(item.id, item.title, item.dueDate);
    alert(`📅 Tarea sincronizada exitosamente con Outlook Calendar (Graph API)\n\nEvento ID: ${result.calendarEventId}\nWebLink: ${result.webLink}`);
  };

  const handleDeleteItem = async (itemId: string) => {
    await api.deleteItem(itemId);
    if (activeBoard) {
      fetchBoard(activeBoard.id);
    }
  };

  const getActiveTab = (): 'board' | 'dashboard' | 'automations' | 'meetings' | 'users' | 'okrs' => {
    if (location.pathname.startsWith('/dashboard')) return 'dashboard';
    if (location.pathname.startsWith('/automations')) return 'automations';
    if (location.pathname.startsWith('/meetings')) return 'meetings';
    if (location.pathname.startsWith('/users')) return 'users';
    if (location.pathname.startsWith('/okrs')) return 'okrs';
    return 'board';
  };

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Header
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
        onOpenAutomations={() => setIsAutomationsModalOpen(true)}
        onOpenUsers={() => navigate('/users')}
        onUpdateCurrentUser={(updated) => {
          setCurrentUser(updated);
          loadInitialData();
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          boards={boards}
          activeBoardId={activeBoard?.id || null}
          activeTab={getActiveTab()}
          currentUser={currentUser}
          onSelectBoard={handleSelectBoard}
          onSelectTab={(tab) => {
            if (tab === 'automations') setIsAutomationsModalOpen(true);
            else navigate(`/${tab}`);
          }}
          onCreateBoard={handleCreateBoard}
        />

        <main className={`flex-1 flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {loading ? (
            <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Cargando datos del tenant M365...
                </p>
              </div>
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  activeBoard ? <Navigate to={`/board/${activeBoard.id}`} replace /> : <Navigate to="/dashboard" replace />
                }
              />
              <Route
                path="/board/:boardId"
                element={
                  activeBoard ? (
                    <BoardView
                      board={activeBoard}
                      users={users}
                      currentUser={currentUser}
                      onUpdateStatus={(itemId, newStatus) => updateItemStatusOptimistic(itemId, newStatus)}
                      onUpdateAssignee={(itemId, userId) => updateItemAssigneeOptimistic(itemId, userId)}
                      onAddItem={(groupId, title) => addItem(groupId, title, currentUser.id)}
                      onAddGroup={(title) => addGroup(title)}
                      onSyncCalendar={handleSyncCalendar}
                      onDeleteItem={handleDeleteItem}
                      onOpenAutomations={() => setIsAutomationsModalOpen(true)}
                      onEditBoard={handleEditBoard}
                      onDeleteBoard={handleDeleteBoard}
                      onRefreshBoard={() => fetchBoard(activeBoard.id)}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                      <p className="text-sm font-semibold">Selecciona un tablero para comenzar.</p>
                    </div>
                  )
                }
              />
              <Route path="/dashboard" element={<MasterDashboard boards={boards} users={users} />} />
              <Route path="/okrs" element={<OkrsView boards={boards} users={users} currentUser={currentUser} />} />
              <Route
                path="/meetings"
                element={
                  activeBoard ? (
                    <MeetingsView board={activeBoard} users={users} onRefreshBoard={() => fetchBoard(activeBoard.id)} />
                  ) : (
                    <div className="p-6 text-center text-sm font-semibold">Selecciona un tablero para ver reuniones.</div>
                  )
                }
              />
              <Route
                path="/users"
                element={
                  <UsersView
                    users={users}
                    currentUser={currentUser}
                    onRefreshUsers={async () => {
                      const userList = await api.getUsers();
                      setUsers(Array.isArray(userList) ? userList : []);
                    }}
                  />
                }
              />
            </Routes>
          )}
        </main>
      </div>

      {activeBoard && (
        <AutomationEditorModal
          board={activeBoard}
          isOpen={isAutomationsModalOpen}
          onClose={() => setIsAutomationsModalOpen(false)}
          onRefresh={() => fetchBoard(activeBoard.id)}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPageWrapper />} />
            <Route path="/*" element={<MainAppContent />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

function LoginPageWrapper() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser]);

  return (
    <LoginPage
      onLoginSuccess={(user) => {
        const token = localStorage.getItem('monday_m365_token') || 'token_sso_m365';
        login(token, user);
        navigate('/dashboard');
      }}
    />
  );
}
