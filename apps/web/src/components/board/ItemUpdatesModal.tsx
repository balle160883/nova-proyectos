import React, { useState } from 'react';
import { MessageSquare, Send, History, X, User as UserIcon, Clock, Tag } from 'lucide-react';
import { Item, User } from '../../types';
import { api } from '../../services/api';

export interface CommentItem {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

interface ItemUpdatesModalProps {
  item: Item;
  users: User[];
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshBoard: () => void;
}

export const ItemUpdatesModal: React.FC<ItemUpdatesModalProps> = ({
  item,
  users = [],
  currentUser,
  isOpen,
  onClose,
  onRefreshBoard,
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'audit'>('comments');
  const [newCommentText, setNewCommentText] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen || !item) return null;

  // Parse item comments array
  const getComments = (): CommentItem[] => {
    if (!item.comments) return [];
    if (Array.isArray(item.comments)) return item.comments;
    if (typeof item.comments === 'string') {
      try {
        return JSON.parse(item.comments);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const commentsList = getComments();

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;
    setSending(true);

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      text: newCommentText.trim(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [newComment, ...commentsList];

    try {
      await api.updateItem(item.id, {
        comments: JSON.stringify(updatedComments),
      });
      setNewCommentText('');
      onRefreshBoard();
    } catch (err) {
      alert('Error al enviar el comentario.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hilo de conversación interno, menciones y registro de actividades de esta tarea.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center space-x-2 px-4 py-2 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'comments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comentarios y Discusión ({commentsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 px-4 py-2 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Auditoría</span>
          </button>
        </div>

        {/* Tab 1: Comments Section */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* New Comment Input Form */}
            <form onSubmit={handleSendComment} className="flex items-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                alt={currentUser?.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Escribe una actualización o avance en este entregable (ej. @Sofia ya aprobé la revisión)..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-blue-500 h-16 resize-none"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || !newCommentText.trim()}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? 'Publicando...' : 'Publicar Comentario'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Comments Stream List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {commentsList.length > 0 ? (
                commentsList.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={c.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                          alt={c.userName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-bold text-xs text-slate-800">{c.userName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium pl-9 leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  No hay comentarios aún en esta tarea. ¡Sé el primero en iniciar la conversación!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Audit History */}
        {activeTab === 'audit' && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center space-x-1.5 text-blue-700">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Tarea Creada en Plataforma Kore Suite</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sistema Kore</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Creada por <strong className="text-slate-800">{item.createdBy?.name || 'Usuario Corporativo'}</strong>
              </p>
            </div>

            {item.status && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Estatus Actualizado</span>
                  <span className="text-[10px] text-slate-400 font-mono">Automático</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  El estatus del entregable es <strong className="text-blue-600">{item.status}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2 rounded-xl">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
