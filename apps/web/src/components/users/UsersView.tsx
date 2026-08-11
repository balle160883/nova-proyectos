import React, { useState, useRef } from 'react';
import { Users, UserPlus, Edit3, Trash2, Camera, Upload, X, Check, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  onRefreshUsers: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
];

export const UsersView: React.FC<UsersViewProps> = ({ users = [], currentUser, onRefreshUsers }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen debe ser menor a 10MB');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setSaving(true);

    try {
      const res = await api.createUser({
        name,
        email,
        password: password || 'Seguridad2026@',
        role,
        avatarUrl: avatarUrl || undefined,
      });

      if (res && (res.id || res.email)) {
        setName('');
        setEmail('');
        setPassword('');
        setRole('MEMBER');
        setAvatarUrl('');
        setShowCreateModal(false);
        onRefreshUsers();
      } else {
        alert(res?.message || 'Error al crear usuario.');
      }
    } catch (err) {
      alert('Error de conexión al crear usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);

    try {
      const updated = await api.updateUser(editingUser.id, {
        name,
        email,
        role,
        avatarUrl: avatarUrl || undefined,
        password: password || undefined,
      });

      if (updated && updated.id) {
        if (currentUser && currentUser.id === editingUser.id) {
          localStorage.setItem('monday_m365_user', JSON.stringify(updated));
        }
        setEditingUser(null);
        setName('');
        setEmail('');
        setPassword('');
        setAvatarUrl('');
        onRefreshUsers();
      } else {
        alert(updated?.message || 'Error al actualizar usuario');
      }
    } catch (err) {
      alert('Error de red al actualizar usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario activo.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar al usuario '${userToDelete.name}' (${userToDelete.email})?`)) {
      await api.deleteUser(userToDelete.id);
      onRefreshUsers();
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role || 'MEMBER');
    setAvatarUrl(u.avatarUrl || '');
    setPassword('');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios — Kore Suite</h1>
            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-purple-300">
              SuperAdmin Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administra los accesos de personal, roles corporativos y fotos de perfil de la plataforma.
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setEmail('');
            setPassword('');
            setRole('MEMBER');
            setAvatarUrl('');
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Usuarios Registrados ({users.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-6">Foto & Usuario</th>
                <th className="py-3 px-6">Correo Electrónico</th>
                <th className="py-3 px-6">Rol de Sistema</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isSuperAdmin = u.role === 'SUPERADMIN';
                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <img src={u.avatarUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm" />
                        <div>
                          <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                                (Tú)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-slate-600">{u.email}</td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`text-[11px] px-3 py-1 rounded-full font-bold border ${
                          isSuperAdmin
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : u.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {u.role || 'MEMBER'}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar usuario y foto"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={isSelf}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelf
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Crear Nuevo Usuario</span>
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Selection */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative group cursor-pointer" onClick={() => createFileInputRef.current?.click()}>
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-md"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
              <input ref={createFileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <button
                type="button"
                onClick={() => createFileInputRef.current?.click()}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto del Usuario</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Lic. Carlos Mendoza"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos.mendoza@koresuite.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Seguridad2026@"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol de Usuario</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="SUPERADMIN">SUPERADMIN (Acceso Total)</option>
                <option value="ADMIN">ADMIN (Administrador de Tableros)</option>
                <option value="MEMBER">MEMBER (Investigador / Miembro)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-xs font-semibold text-slate-500">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg">
                {saving ? 'Guardando...' : 'Guardar Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateUser} className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Editar Usuario: {editingUser.name}</span>
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group cursor-pointer" onClick={() => editFileInputRef.current?.click()}>
                <img
                  src={avatarUrl || editingUser.avatarUrl}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-md"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">Cambiar Foto</span>
                </div>
              </div>
              <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cambiar Foto del Usuario</span>
                </button>
              </div>

              {/* URL Direct Input */}
              <div className="w-full">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="O pega la URL/Link de la imagen de perfil..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-600"
                />
              </div>

              {/* Preset Avatars Selection */}
              <div className="flex items-center justify-between gap-1.5 w-full pt-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all transform hover:scale-105 ${
                      avatarUrl === url ? 'border-blue-600 ring-2 ring-blue-300' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña (Opcional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar en blanco para mantener la actual"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol de Usuario</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="SUPERADMIN">SUPERADMIN (Acceso Total)</option>
                <option value="ADMIN">ADMIN (Administrador de Tableros)</option>
                <option value="MEMBER">MEMBER (Investigador / Miembro)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setEditingUser(null)} className="text-xs font-semibold text-slate-500">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg">
                {saving ? 'Actualizando...' : 'Actualizar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
