import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Lock, Mail } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.loginPassword({ email: email.trim(), password });
      if (res.user) {
        localStorage.setItem('monday_m365_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans select-none">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        {/* Kore Suite Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              K
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Kore<span className="text-blue-600"> Suite</span></span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Iniciar Sesión en tu Espacio de Trabajo</h2>
          <p className="text-xs text-slate-500 font-medium">Plataforma de Coordinación de Proyectos & M365</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ing.ballesteros16@gmail.com"
                className="w-full border border-slate-300 focus:border-blue-600 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-medium outline-none transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-slate-300 focus:border-blue-600 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-medium outline-none transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-400 mt-6 font-medium">
        Kore Suite Platform &copy; 2026
      </p>
    </div>
  );
};
