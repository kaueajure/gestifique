import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AppLogo } from '../ui/Logo';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface SatisfactionPageProps {
  token: string;
}

export function SatisfactionPage({ token }: SatisfactionPageProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<any>(null);

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    api.get(`/satisfaction/${token}`)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Pesquisa inválida ou expirada.');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/satisfaction/${token}`, { nota: rating, comentario: comment });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
           <AppLogo size={56} className="mb-4 mx-auto" />
           <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Pesquisa de Satisfação</h2>
           <p className="text-sm text-slate-500 font-medium">Sua opinião é muito importante para nós.</p>
        </div>

        <Card className="p-8 shadow-xl shadow-slate-200/50">
           {error && !success ? (
             <div className="text-center space-y-4">
               <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                 <AlertCircle className="w-8 h-8 text-red-600" />
               </div>
               <h3 className="text-lg font-medium text-slate-900">Ops!</h3>
               <p className="text-sm text-slate-600">{error}</p>
             </div>
           ) : success || data?.respondido_em ? (
             <div className="text-center space-y-4">
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center"
               >
                 <CheckCircle className="w-8 h-8 text-emerald-600" />
               </motion.div>
               <h3 className="text-lg font-medium text-slate-900">Obrigado!</h3>
               <p className="text-sm text-slate-600">Sua avaliação foi registrada com sucesso.</p>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700 mb-4">Como você avalia o atendimento recebido?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-10 h-10 ${
                            star <= (hoverRating || rating) 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-slate-300'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    {rating === 1 && 'Muito ruim'}
                    {rating === 2 && 'Ruim'}
                    {rating === 3 && 'Regular'}
                    {rating === 4 && 'Bom'}
                    {rating === 5 && 'Excelente'}
                    {rating === 0 && 'Selecione uma nota'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block text-left">
                    Comentário (opcional)
                  </label>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none"
                    rows={4}
                    placeholder="Deixe um comentário sobre o atendimento..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={rating === 0 || submitting} 
                  className="w-full h-11"
                >
                  {submitting ? 'Enviando...' : 'Enviar Avaliação'}
                </Button>
             </form>
           )}
        </Card>
      </motion.div>
    </div>
  );
}
