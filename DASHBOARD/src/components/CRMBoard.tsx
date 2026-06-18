import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Phone, ExternalLink } from 'lucide-react';

const COLUMNS = ['New Lead', 'Contacted', 'Meeting Booked', 'Closed', 'Rejected'];

export function CRMBoard({ leads, setLeads }: { leads: any[], setLeads: any }) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || !newStatus) return;

    // Optimistic UI update
    setLeads((prev: any[]) => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    
    // Supabase update
    await supabase.from('companies').update({ status: newStatus }).eq('id', id);
    setDraggingId(null);
  };

  // Group leads by status
  const groupedLeads = COLUMNS.reduce((acc, col) => {
    acc[col] = leads.filter(l => (l.status || 'New Lead') === col);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex space-x-6 overflow-x-auto pb-8 h-[calc(100vh-200px)]">
      {COLUMNS.map(column => (
        <div 
          key={column}
          className="flex-shrink-0 w-80 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">{column}</h3>
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">
              {groupedLeads[column].length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {groupedLeads[column].map(lead => (
              <div 
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead.id)}
                className={`bg-slate-800 p-4 rounded-lg border border-slate-700 cursor-grab active:cursor-grabbing shadow-sm hover:border-emerald-500/50 transition-colors ${draggingId === lead.id ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-slate-200 text-sm truncate pr-2">{lead.name}</h4>
                  {lead.quality_score >= 3 && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      Hot
                    </span>
                  )}
                </div>
                
                {lead.sector && (
                  <p className="text-xs text-slate-400 mb-3 truncate">{lead.sector}</p>
                )}

                <div className="flex items-center space-x-3 text-slate-400">
                  {lead.domain && (
                    <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {(lead.email_1 || lead.contact_email) && (
                    <a href={`mailto:${lead.contact_email || lead.email_1}`} className="hover:text-emerald-400 transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {lead.phone && (
                    <Phone className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
            ))}
            
            {groupedLeads[column].length === 0 && (
              <div className="border-2 border-dashed border-slate-700/50 rounded-lg h-24 flex items-center justify-center text-slate-500 text-sm">
                Drop leads here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
