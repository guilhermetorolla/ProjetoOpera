import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Info, 
  Plus, 
  Settings, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  X,
  Camera,
  Trash2,
  FileText
} from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import { Environment, Booking } from '../types';

export default function Schedule() {
  const { 
    environments, 
    setEnvironments, 
    bookings, 
    setBookings, 
    currentUser,
    logActivity
  } = useData();
  
  const [selectedEnvId, setSelectedEnvId] = useState<string>(environments[0]?.id || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // New Environment Form State
  const [newEnv, setNewEnv] = useState<Partial<Environment>>({
    name: '',
    description: '',
    rules: [''],
    capacity: 0,
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000'
  });

  // Booking Form State
  const [newBooking, setNewBooking] = useState({
    title: '',
    startTime: '2024-04-16T10:00',
    endTime: '2024-04-16T11:00'
  });

  // Selected Environment
  const selectedEnv = environments.find(e => e.id === selectedEnvId) || environments[0];

  const handleRegister = () => {
    const env: Environment = {
      id: `env-${Date.now()}`,
      name: newEnv.name || 'Novo Ambiente',
      description: newEnv.description || '',
      rules: newEnv.rules?.filter(r => r.trim() !== '') || [],
      capacity: newEnv.capacity || 0,
      image: newEnv.image || 'https://images.unsplash.com/photo-1497160123023-589f63160e90?auto=format&fit=crop&q=80&w=1000'
    };
    setEnvironments([...environments, env]);
    logActivity('registrou o ambiente', env.name, 'INFRAESTRUTURA');
    setIsRegistering(false);
    setNewEnv({ name: '', description: '', rules: [''], capacity: 0 });
  };

  const handleBooking = () => {
    const booking: Booking = {
      id: `b-${Date.now()}`,
      environmentId: selectedEnvId,
      userId: currentUser.id,
      title: newBooking.title || 'Reunião Sem Título',
      startTime: `${newBooking.startTime}:00Z`,
      endTime: `${newBooking.endTime}:00Z`
    };
    setBookings([...bookings, booking]);
    logActivity('agendou o espaço', selectedEnv.name, 'INFRAESTRUTURA', [booking.title]);
    setIsBooking(false);
    setNewBooking({ title: '', startTime: '2024-04-16T10:00', endTime: '2024-04-16T11:00' });
  };

  const handleEdit = () => {
    const updated = environments.map(e => e.id === selectedEnvId ? { ...e, ...newEnv } as Environment : e);
    setEnvironments(updated);
    setIsEditing(false);
  };

  const handleAddRule = () => {
     setNewEnv({ ...newEnv, rules: [...(newEnv.rules || []), ''] });
  };

  const handleUpdateRule = (index: number, value: string) => {
    const rules = [...(newEnv.rules || [])];
    rules[index] = value;
    setNewEnv({ ...newEnv, rules });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-12 py-8 flex items-end justify-between shrink-0 glass-panel border-none rounded-none m-0 z-20 bg-white/20 dark:bg-black/20 backdrop-blur-md">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] dark:text-white/40 tracking-widest uppercase mb-1">
            <span>Infraestrutura</span>
            <span className="opacity-30">/</span>
            <span className="text-black dark:text-white">Gestão de Ambientes</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tighter text-black dark:text-white transition-colors">Agendamento de Precisão</h2>
        </div>
        
        <button 
          onClick={() => setIsRegistering(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={14} /> Registrar Ambiente
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden p-8 gap-8">
        {/* Left Bar: Environments List */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto scrollbar-hide">
          <h3 className="text-[10px] font-extrabold text-[#5d5e66] dark:text-white/40 uppercase tracking-widest mb-2 px-2">Ambientes Disponíveis</h3>
          {environments.map(env => (
            <button
              key={env.id}
              onClick={() => setSelectedEnvId(env.id)}
              className={cn(
                "group relative w-full text-left p-4 rounded-2xl transition-all duration-300 border h-32 overflow-hidden",
                selectedEnvId === env.id 
                  ? "bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/10 shadow-xl scale-[1.02] backdrop-blur-md" 
                  : "bg-white/10 dark:bg-white/[0.02] border-neutral-100 dark:border-white/5 shadow-sm hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm"
              )}
            >
              <img src={env.image} className="absolute inset-0 w-full h-full object-cover opacity-10 dark:opacity-5 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity" alt="" />
              <div className="relative z-10">
                <h4 className="font-bold text-sm text-black dark:text-white mb-1">{env.name}</h4>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-wider">
                  <Users size={12} /> Máx {env.capacity} pessoas
                </div>
              </div>
              {selectedEnvId === env.id && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black dark:bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* Right Section: Detail & Agenda */}
        <div className="flex-1 flex flex-col gap-8 overflow-y-auto scrollbar-hide">
          {selectedEnv && (
            <motion.div 
              key={selectedEnv.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Env Detail Card */}
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm border border-neutral-100 dark:border-white/10 flex h-[350px]">
                <div className="w-1/2 relative group">
                  <img src={selectedEnv.image} className="absolute inset-0 w-full h-full object-cover" alt={selectedEnv.name} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <button className="absolute top-6 left-6 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={18} />
                  </button>
                </div>
                <div className="w-1/2 p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-3xl font-extrabold tracking-tighter text-black dark:text-white">{selectedEnv.name}</h3>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-2 hover:bg-neutral-50 dark:hover:bg-white/10 rounded-lg text-[#5d5e66] dark:text-white/60 transition-colors"
                      >
                        <Settings size={20} />
                      </button>
                    </div>
                    <p className="text-[#5d5e66] dark:text-white/40 text-sm leading-relaxed mb-6">
                      {selectedEnv.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-neutral-100 dark:bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">WiFi 6e</span>
                      <span className="bg-neutral-100 dark:bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">4K Display</span>
                      <span className="bg-neutral-100 dark:bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Soundproof</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsBooking(true)}
                    className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-transform"
                  >
                    Agendar Horário
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* Rules Section */}
                <div className="col-span-5 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-neutral-100 dark:border-white/10 shadow-sm h-full">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] dark:text-white/40 mb-6">Regulamento do Ambiente</h4>
                  <ul className="space-y-4">
                    {selectedEnv.rules.map((rule, i) => (
                      <li key={i} className="flex gap-4 group">
                        <CheckCircle2 size={16} className="text-black dark:text-white shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span className="text-sm font-medium leading-relaxed text-black dark:text-white/60">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Agenda Section */}
                <div className="col-span-7 bg-white/10 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl h-full flex flex-col border border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-sm font-bold tracking-tight text-black dark:text-white">Ocupação de Hoje</h4>
                    <span className="text-[10px] font-bold uppercase text-[#5d5e66] dark:text-white/40">16 ABR, 2024</span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {bookings.filter(b => b.environmentId === selectedEnv.id).length > 0 ? (
                      bookings.filter(b => b.environmentId === selectedEnv.id).map(booking => (
                        <div key={booking.id} className="bg-white/30 dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-between group hover:scale-[1.01] transition-transform cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xs">
                              {booking.startTime.split('T')[1].substring(0, 2)}
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-black dark:text-white">{booking.title}</h5>
                              <div className="flex items-center gap-4 mt-1 text-[10px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Clock size={12} /> {booking.startTime.split('T')[1].substring(0, 5)} - {booking.endTime.split('T')[1].substring(0, 5)}</span>
                              </div>
                            </div>
                          </div>
                          <img src={currentUser.avatar} className="w-8 h-8 rounded-full border-2 border-neutral-50 dark:border-white/10" alt="" />
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30 dark:opacity-10 text-black dark:text-white">
                        <CalendarIcon size={40} className="mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Nenhuma reserva agendada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#121212] w-full max-w-md rounded-[40px] p-10 relative shadow-2xl border border-black/5 dark:border-white/10"
            >
              <button 
                onClick={() => setIsBooking(false)} 
                className="absolute top-8 right-8 p-2 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-full text-black dark:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-3xl font-extrabold tracking-tighter mb-8 text-black dark:text-white">Agendar Horário</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Título da Reserva</label>
                  <input 
                    type="text" 
                    value={newBooking.title}
                    onChange={e => setNewBooking({ ...newBooking, title: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                    placeholder="Ex: Sync de Design"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Início</label>
                    <input 
                      type="datetime-local" 
                      value={newBooking.startTime}
                      onChange={e => setNewBooking({ ...newBooking, startTime: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Fim</label>
                    <input 
                      type="datetime-local" 
                      value={newBooking.endTime}
                      onChange={e => setNewBooking({ ...newBooking, endTime: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleBooking}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform mt-4"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration / Edit Modal */}
      <AnimatePresence>
        {(isRegistering || isEditing) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-8 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#121212] w-full max-w-2xl rounded-[40px] p-12 relative shadow-2xl overflow-hidden border border-black/5 dark:border-white/10"
            >
              <button 
                onClick={() => { setIsRegistering(false); setIsEditing(false); }}
                className="absolute top-8 right-8 p-3 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-full transition-colors text-black dark:text-white"
              >
                <X size={24} />
              </button>

              <header className="mb-12">
                <h3 className="text-4xl font-extrabold tracking-tighter mb-2 text-black dark:text-white">{isEditing ? 'Editar Ambiente' : 'Novo Ambiente'}</h3>
                <p className="text-[#5d5e66] dark:text-white/40 font-medium text-sm tracking-tight opacity-70">Defina os parâmetros para o espaço da Opero.</p>
              </header>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Nome do Espaço</label>
                    <input 
                      type="text" 
                      value={newEnv.name}
                      onChange={e => setNewEnv({ ...newEnv, name: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                      placeholder="Ex: Laboratório Gamma"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Capacidade Máxima</label>
                    <input 
                      type="number" 
                      value={newEnv.capacity}
                      onChange={e => setNewEnv({ ...newEnv, capacity: parseInt(e.target.value) })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">URL da Foto de Identificação</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={newEnv.image}
                      onChange={e => setNewEnv({ ...newEnv, image: e.target.value })}
                      className="flex-1 bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Descrição Profissional</label>
                  <textarea 
                    value={newEnv.description}
                    onChange={e => setNewEnv({ ...newEnv, description: e.target.value })}
                    rows={3}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-medium text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none resize-none" 
                    placeholder="Descreva a finalidade e características do ambiente..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Regras de Conduta</label>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                    {newEnv.rules?.map((rule, idx) => (
                      <div key={idx} className="flex gap-4">
                        <input 
                          type="text" 
                          value={rule}
                          onChange={e => handleUpdateRule(idx, e.target.value)}
                          className="flex-1 bg-neutral-50 dark:bg-white/5 border-none rounded-xl p-3 text-[10px] font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                          placeholder={`Regra #${idx + 1}`}
                        />
                         <button 
                          onClick={() => {
                            const rs = newEnv.rules?.filter((_, i) => i !== idx);
                            setNewEnv({ ...newEnv, rules: rs });
                          }}
                          className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleAddRule}
                    className="text-[10px] font-extrabold text-[#5d5e66] dark:text-white/40 hover:text-black dark:hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Adicionar Protocolo
                  </button>
                </div>

                <div className="pt-8 border-t border-neutral-100 dark:border-white/10 flex gap-4">
                  <button 
                    onClick={() => { setIsRegistering(false); setIsEditing(false); }}
                    className="flex-1 py-4 bg-neutral-100 dark:bg-white/5 text-[#5d5e66] dark:text-white/40 text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] hover:bg-neutral-200 dark:hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={isEditing ? handleEdit : handleRegister}
                    className="flex-2 py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    {isEditing ? 'Salvar Alterações' : 'Confirmar Registro'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
