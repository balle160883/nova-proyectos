import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, MessageSquare, UserCheck, Zap, X, Clock } from 'lucide-react';
import { User } from '../../types';

export interface NotificationItem {
  id: string;
  type: 'ASSIGNMENT' | 'MENTION' | 'ALERT' | 'AUTOMATION';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationsPanelProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'ALERT',
    title: '🚨 Entregable Bloqueado',
    message: 'Auditoría de cumplimiento de estándares de calidad cambió a BLOQUEADO.',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    isRead: false,
  },
  {
    id: 'n-2',
    type: 'MENTION',
    title: '💬 Nueva mención en Hilo',
    message: 'Ing. Sofía Rodríguez te mencionó en Elaborar propuesta ejecutiva.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
  },
  {
    id: 'n-3',
    type: 'ASSIGNMENT',
    title: '📌 Asignación de Tarea',
    message: 'Te han asignado como responsable del entregable Presupuestal Q3.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isRead: true,
  },
  {
    id: 'n-4',
    type: 'AUTOMATION',
    title: '⚡ Automatización Ejecutada',
    message: 'Motor M365 notificó exitosamente por correo al responsable asignado.',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    isRead: true,
  },
];

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ currentUser, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const formatTimeAgo = (isoStr: string) => {
    const minutes = Math.floor((Date.now() - new Date(isoStr).getTime()) / (1000 * 60));
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hr${hours > 1 ? 's' : ''}`;
    return new Date(isoStr).toLocaleDateString();
  };

  return (
    <div className="absolute right-16 top-12 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150 overflow-hidden select-none">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            )}
          </div>
          <h3 className="font-bold text-sm">Centro de Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">
              {unreadCount} nuevas
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sub Toolbar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="text-blue-600 hover:text-blue-800 disabled:opacity-40 font-bold flex items-center space-x-1"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Marcar leídas</span>
        </button>

        <button
          onClick={handleClearAll}
          disabled={notifications.length === 0}
          className="text-slate-400 hover:text-red-600 disabled:opacity-40 font-semibold flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* Notification Stream List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 flex items-start space-x-3 transition-colors ${
                n.isRead ? 'bg-white' : 'bg-blue-50/50 font-medium'
              } hover:bg-slate-50`}
            >
              {/* Type Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {n.type === 'ALERT' && (
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {n.type === 'MENTION' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}
                {n.type === 'ASSIGNMENT' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                )}
                {n.type === 'AUTOMATION' && (
                  <div className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">{n.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatTimeAgo(n.timestamp)}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
              </div>

              {/* Mark as read button */}
              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
                  title="Marcar como leída"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No tienes notificaciones pendientes.
          </div>
        )}
      </div>
    </div>
  );
};
