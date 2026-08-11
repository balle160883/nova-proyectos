import { useState, useEffect, useCallback } from 'react';
import { Board, User } from '../types';
import { api } from '../services/api';
import { io, Socket } from 'socket.io-client';

export function useBoardStore(initialBoardId: string | null) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch boards list
  const fetchBoards = useCallback(async () => {
    try {
      const data = await api.getBoards();
      const validBoards = Array.isArray(data) ? data : [];
      setBoards(validBoards);
      return validBoards;
    } catch (e) {
      console.error('Failed to fetch boards:', e);
      return [];
    }
  }, []);

  // Fetch single full board
  const fetchBoard = useCallback(async (boardId: string) => {
    setLoading(true);
    setError(null);
    try {
      const fullBoard = await api.getBoard(boardId);
      if (fullBoard && !fullBoard.statusCode && fullBoard.id) {
        setActiveBoard(fullBoard);
        return fullBoard;
      }
    } catch (e) {
      console.error(`Failed to fetch board ${boardId}:`, e);
      setError('Error al cargar el tablero');
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // WebSockets setup for live collaboration
  useEffect(() => {
    if (!activeBoard?.id) return;

    const socket: Socket = io('http://localhost:3001');

    socket.on('connect', () => {
      socket.emit('join:board', { boardId: activeBoard.id });
    });

    const handleBoardUpdate = async () => {
      const updated = await api.getBoard(activeBoard.id);
      if (updated && updated.id) setActiveBoard(updated);
      const boardList = await api.getBoards();
      if (Array.isArray(boardList)) setBoards(boardList);
    };

    socket.on('item:created', handleBoardUpdate);
    socket.on('item:updated', handleBoardUpdate);
    socket.on('item:deleted', handleBoardUpdate);
    socket.on('item:status_changed', handleBoardUpdate);
    socket.on('group:created', handleBoardUpdate);
    socket.on('column:created', handleBoardUpdate);
    socket.on('board:updated', handleBoardUpdate);

    return () => {
      socket.disconnect();
    };
  }, [activeBoard?.id]);

  // OPTIMISTIC UPDATES: Update item status instantly in local React state
  const updateItemStatusOptimistic = async (itemId: string, newStatus: string) => {
    if (!activeBoard) return;

    // Save previous state for rollback if server call fails
    const previousBoard = activeBoard;

    // Apply optimistic update immediately
    const updatedGroups = activeBoard.groups.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.id === itemId ? { ...item, status: newStatus } : item
      ),
    }));

    setActiveBoard({ ...activeBoard, groups: updatedGroups });

    try {
      await api.updateItem(itemId, { status: newStatus });
    } catch (e) {
      console.error('Optimistic update failed, rolling back:', e);
      setActiveBoard(previousBoard);
    }
  };

  // OPTIMISTIC UPDATES: Update item assignee instantly
  const updateItemAssigneeOptimistic = async (itemId: string, userId: string, userObj?: User) => {
    if (!activeBoard) return;

    const previousBoard = activeBoard;

    const updatedGroups = activeBoard.groups.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.id === itemId ? { ...item, assignedToId: userId, assignedTo: userObj || item.assignedTo } : item
      ),
    }));

    setActiveBoard({ ...activeBoard, groups: updatedGroups });

    try {
      await api.updateItem(itemId, { assignedToId: userId });
    } catch (e) {
      console.error('Optimistic update failed, rolling back:', e);
      setActiveBoard(previousBoard);
    }
  };

  // Create item
  const addItem = async (groupId: string, title: string, createdById: string) => {
    if (!activeBoard) return;
    try {
      await api.createItem({
        title,
        groupId,
        boardId: activeBoard.id,
        createdById,
        status: 'Not Started',
      });
      const updated = await api.getBoard(activeBoard.id);
      if (updated && updated.id) setActiveBoard(updated);
    } catch (e) {
      console.error('Add item failed:', e);
    }
  };

  // Create group
  const addGroup = async (title: string) => {
    if (!activeBoard) return;
    try {
      await api.createGroup({
        title,
        boardId: activeBoard.id,
        color: '#A54EE1',
      });
      const updated = await api.getBoard(activeBoard.id);
      if (updated && updated.id) setActiveBoard(updated);
    } catch (e) {
      console.error('Add group failed:', e);
    }
  };

  return {
    boards,
    activeBoard,
    loading,
    error,
    fetchBoards,
    fetchBoard,
    setActiveBoard,
    updateItemStatusOptimistic,
    updateItemAssigneeOptimistic,
    addItem,
    addGroup,
  };
}
