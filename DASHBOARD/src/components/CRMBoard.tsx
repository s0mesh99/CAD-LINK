import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, ExternalLink } from 'lucide-react';

const COLUMNS = ['New Lead', 'Contacted', 'Meeting Booked', 'Proposal Sent', 'Closed Won', 'Rejected'];

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
          className="flex-shrink-0 w-[340px] bg-slate-50/50 rounded-2xl p-4 border border-slate-200 flex flex-col shadow-sm"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column)}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-slate-800">{column}</h3>
            <span className="bg-white text-slate-500 font-bold text-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
              {groupedLeads[column].length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {groupedLeads[column].length === 0 && (
              <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                Drop leads here
              </div>
            )}
            {groupedLeads[column].map(lead => (
              <div 
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead.id)}
                className={`bg-white p-4 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing shadow-sm hover:border-indigo-500 hover:shadow-md transition-all ${draggingId === lead.id ? 'opacity-50 scale-95' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{lead.name || 'Unnamed Company'}</h4>
                  {lead.quality_score >= 4 && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">HOT</span>}
                </div>
                {lead.domain && <div className="text-xs text-slate-500 mb-2 truncate">{lead.domain}</div>}
                
                <div className="flex items-center justify-between text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[120px]">{lead.contact_email || lead.email_1 || 'No email'}</span>
                  </div>
                  {lead.domain && (
                    <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
