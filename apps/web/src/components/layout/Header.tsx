import React, { useState, useRef } from 'react';
import {
  Search,
  Grid,
  Zap,
  ShieldCheck,
  UserCheck,
  LogOut,
  Users,
  X,
  Camera,
  Upload,
  Check,
  Sparkles,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';
import { NotificationsPanel } from './NotificationsPanel';

interface HeaderProps {
  currentUser: User | null;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLogout: () => void;
  onOpenAutomations: () => void;
  onOpenUsers: () => void;
  onUpdateCurrentUser?: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  theme = 'light',
  onToggleTheme = () => {},
  onLogout,
  onOpenAutomations,
  onOpenUsers,
  onUpdateCurrentUser,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatarUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
      const updated = await api.updateUser(currentUser.id, {
        name,
        avatarUrl,
      });
      localStorage.setItem('monday_m365_user', JSON.stringify(updated));
      if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
      setShowProfileModal(false);
    } catch (err) {
      alert('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="h-14 bg-[#0F172A] text-white flex items-center justify-between px-4 shadow-md select-none z-20 sticky top-0 border-b border-slate-800 relative">
      {/* Left: App Launcher & Logo */}
      <div className="flex items-center space-x-3">
        <button className="p-1.5 hover:bg-slate-800 rounded-md transition-colors" title="Microsoft 365 App Launcher">
          <Grid className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-extrabold text-sm tracking-wider shadow-inner text-white">
            K
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Kore <span className="text-blue-400 font-semibold">Suite</span></span>
          <span className="bg-blue-900/60 text-blue-200 text-xs px-2 py-0.5 rounded-full font-medium border border-blue-500/40">
            Enterprise M365
          </span>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar tareas, entregables, personas o automatizaciones..."
            className="w-full bg-slate-800/80 hover:bg-slate-800 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 placeholder-slate-400 text-sm rounded-lg pl-9 pr-4 py-1.5 outline-none transition-all border border-slate-700 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, Notifications & Profile */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white flex items-center justify-center"
          title={theme === 'dark' ? 'Cambiar a Modo Claro Corporativo' : 'Cambiar a Modo Oscuro Ejecutivo'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-400 animate-spin-slow" />
          ) : (
            <Moon className="w-5 h-5 text-blue-400" />
          )}
        </button>

        <button
          onClick={onOpenAutomations}
          className="flex items-center space-x-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-xs px-3 py-1.5 rounded-full border border-yellow-400/40 transition-all font-medium"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>Automatizaciones</span>
        </button>

        {currentUser && (currentUser.role === 'SUPERADMIN' || currentUser.role === 'ADMIN') && (
          <button
            onClick={onOpenUsers}
            className="flex items-center space-x-1.5 bg-purple-500/30 hover:bg-purple-500/40 text-purple-100 text-xs px-3 py-1.5 rounded-full border border-purple-400/40 transition-all font-semibold"
          >
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span>Usuarios SuperAdmin</span>
          </button>
        )}

        {/* Notifications Bell Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors relative text-slate-300 hover:text-white"
            title="Centro de Notificaciones en tiempo real"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
          </button>
        </div>

        <div className="flex items-center space-x-1 text-xs bg-slate-800/90 px-2.5 py-1 rounded-lg text-slate-200 border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Entra ID SSO</span>
        </div>

        {/* User Profile Avatar */}
        {currentUser ? (
          <div className="flex items-center space-x-2">
            <div
              onClick={() => {
                setAvatarUrl(currentUser.avatarUrl || '');
                setName(currentUser.name || '');
                setShowProfileModal(true);
              }}
              className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 pl-2 pr-3 py-1 rounded-full border border-slate-700 cursor-pointer transition-all transform active:scale-95 group"
              title="Haz clic para personalizar tu foto de perfil y datos"
            >
              <div className="relative">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                  alt={currentUser.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-white/60 shadow-sm"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {(currentUser.name || 'Usuario').split(' ')[0]}
                </span>
                <span className="text-[9px] text-blue-400 font-bold uppercase mt-0.5">
                  {currentUser.role || 'MEMBER'}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>

      {/* Notifications Drawer */}
      <NotificationsPanel
        currentUser={currentUser}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* PROFILE & CUSTOM AVATAR MODAL */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-800">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Mi Perfil y Foto de Perfil — Kore Suite</h3>
              </div>
              <button type="button" onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Preview & Upload Area */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={avatarUrl || currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Cambiar Imagen</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-slate-300"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Subir Imagen desde el Equipo</span>
              </button>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
                required
              />
            </div>

            {/* Custom URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">O pega el Enlace / URL de tu Imagen</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://misitio.com/mi-foto.png"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-600"
              />
            </div>

            {/* Presets Gallery */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">O elige un Avatar Predefinido</label>
              <div className="flex items-center justify-between gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all transform hover:scale-105 ${
                      avatarUrl === url ? 'border-blue-600 ring-2 ring-blue-300' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-xs font-semibold text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Foto de Perfil'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};
