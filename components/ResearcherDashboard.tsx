import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList 
} from 'recharts';
import { Researcher, ResearcherStatus } from '../types';
import { Users, UserPlus, Activity, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface ResearcherDashboardProps {
  researchers: Researcher[];
}

/** 
 * Couleurs lo-fi thématiques
 */
const COLORS = {
  gender: ['#3452ff', '#f20066', '#929393'], // Bleu, Rose Magenta, Gris
  age: ['#03c15e', '#3452ff', '#ffcc01', '#f20066'], // Émeraude, Bleu, Jaune, Magenta
  primary: '#3452ff',
  dark: '#13100d'
};

export const ResearcherDashboard: React.FC<ResearcherDashboardProps> = ({ researchers }) => {
  
  // ... (useMemo logic stays the same)
  const statusData = useMemo(() => {
    let interne = 0; let depart = 0; let parti = 0; let externe = 0;
    researchers.forEach(r => {
      if (r.status === ResearcherStatus.INTERNE) interne++;
      else if (r.status === ResearcherStatus.DEPART) depart++;
      else if (r.status === ResearcherStatus.PARTI) parti++;
      else externe++;
    });
    return [
      { name: 'Interne', value: interne, color: '#6bedd1' }, // Teal
      { name: 'Départ', value: depart, color: '#f20066' },  // Pink
      { name: 'Parti', value: parti, color: '#3452ff' },    // Blue
      { name: 'Externe', value: externe, color: '#ffcc01' }, // Yellow
    ].filter(d => d.value > 0);
  }, [researchers]);

  const genderData = useMemo(() => {
    let f = 0; let m = 0; let other = 0;
    researchers.forEach(r => {
      const civ = (r.civility || '').toUpperCase().trim();
      // On élargit la détection pour être résilient aux variations de saisie
      if (civ === 'F' || civ === 'MME' || civ.startsWith('MME') || civ.startsWith('MADAME') || civ.startsWith('MLLE')) {
        f++;
      } else if (civ === 'M' || civ === 'M.' || civ.startsWith('M.') || civ.startsWith('MONSIEUR') || civ.startsWith('MR')) {
        m++;
      } else if (civ !== '') {
        other++;
      }
    });

    return [
      { name: 'Femmes', value: f, color: COLORS.gender[1] },
      { name: 'Hommes', value: m, color: COLORS.gender[0] },
      { name: 'Inconnu', value: other, color: COLORS.gender[2] },
    ].filter(d => d.value > 0 || d.name !== 'Inconnu'); // On garde toujours Femmes/Hommes même à 0
  }, [researchers]);

  const ageData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const buckets = [
      { name: '< 30 ans', value: 0 },
      { name: '31-45 ans', value: 0 },
      { name: '46-60 ans', value: 0 },
      { name: '61+ ans', value: 0 },
    ];
    researchers.forEach(r => {
      if (r.birthDate && typeof r.birthDate === 'string' && r.birthDate.includes('-')) {
        const yearStr = r.birthDate.split('-')[0];
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const age = currentYear - year;
          if (age <= 30) buckets[0].value++;
          else if (age <= 45) buckets[1].value++;
          else if (age <= 60) buckets[2].value++;
          else buckets[3].value++;
        }
      }
    });
    return buckets;
  }, [researchers]);

  const gradeData = useMemo(() => {
    const counts: Record<string, number> = {};
    researchers.forEach(r => {
      const g = r.employment.grade || 'Inconnu';
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [researchers]);

  const labData = useMemo(() => {
    const counts: Record<string, number> = {};
    researchers.forEach(r => {
      const lab = r.affiliations.find(a => a.isPrimary)?.structureName || r.affiliations[0]?.structureName || 'Non défini';
      counts[lab] = (counts[lab] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [researchers]);

  const employerData = useMemo(() => {
    const counts: Record<string, number> = {};
    researchers.forEach(r => {
      const emp = r.employment.employer || 'Non défini';
      counts[emp] = (counts[emp] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [researchers]);

  const contractTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    researchers.forEach(r => {
      const ct = r.employment.contractType || 'Non défini';
      counts[ct] = (counts[ct] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [researchers]);

  const stats = useMemo(() => {
    const hdrCount = researchers.filter(r => r.extra?.hdr).length;
    return {
      total: researchers.length,
      hdrCount,
      percentageHdr: researchers.length > 0 ? Math.round((hdrCount / researchers.length) * 100) : 0
    };
  }, [researchers]);

  const identifierData = useMemo(() => {
    const counts = { orcid: 0, hal: 0, idref: 0, scopus: 0 };
    researchers.forEach(r => {
      if (r.identifiers.orcid) counts.orcid++;
      if (r.identifiers.halId) counts.hal++;
      if (r.identifiers.idref) counts.idref++;
      if (r.identifiers.scopusId) counts.scopus++;
    });
    return [
      { name: 'ORCID', value: counts.orcid, color: '#A6CE39' },
      { name: 'HAL', value: counts.hal, color: '#212139' },
      { name: 'IdRef', value: counts.idref, color: '#212139' },
      { name: 'Scopus', value: counts.scopus, color: '#FF8200' },
    ];
  }, [researchers]);

  if (researchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400 font-pixel">
        <Activity className="w-16 h-16 opacity-20 mb-4" />
        <p className="text-2xl">NO DATA FOUND</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      
      {/* Tuiles de Stats Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel flex items-center gap-5 transition-all">
          <div className="p-3 bg-pixel-blue border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-mono font-bold tracking-widest mb-1">Effectifs</p>
            <p className="text-4xl font-pixel dark:text-white leading-none">{stats.total}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel flex items-center gap-5 transition-all">
          <div className="p-3 bg-pixel-pink border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-mono font-bold tracking-widest mb-1">Taux de HDR</p>
            <p className="text-4xl font-pixel dark:text-white leading-none">{stats.percentageHdr}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel flex items-center gap-5 transition-all">
          <div className="p-3 bg-pixel-teal border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <UserPlus className="w-7 h-7 text-gray-900" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-mono font-bold tracking-widest mb-1">Total HDR</p>
            <p className="text-4xl font-pixel dark:text-white leading-none">{stats.hdrCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
        
        {/* Répartition par Statut */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[380px] flex flex-col transition-all">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <PieIcon className="w-5 h-5 text-pixel-teal" /> Répartition Statuts
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={statusData} 
                  innerRadius={60} 
                  outerRadius={85} 
                  paddingAngle={4} 
                  dataKey="value" 
                  strokeWidth={2} 
                  stroke={localStorage.getItem('theme') === 'dark' ? '#000' : '#fff'}
                >
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Legend 
                   verticalAlign="bottom" 
                   height={36} 
                   iconType="square" 
                   formatter={(value) => <span className="text-[10px] font-bold uppercase font-mono">{value}</span>} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Parité H/F */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[380px] flex flex-col transition-all">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <PieIcon className="w-5 h-5 text-pixel-pink" /> Parité Genre
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={2} stroke={localStorage.getItem('theme') === 'dark' ? '#000' : '#fff'}>
                  {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="square" formatter={(value) => <span className="text-[10px] font-bold uppercase font-mono">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pyramide des ages */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[380px] flex flex-col transition-all">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <Activity className="w-5 h-5 text-pixel-teal" /> Tranches d'Âge
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#00000010" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#00000005' }} contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Bar dataKey="value" radius={0} barSize={40} stroke="#000" strokeWidth={1}>
                  {ageData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS.age[index % COLORS.age.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Couverture Identifiants */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[380px] flex flex-col transition-all">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <Activity className="w-5 h-5 text-pixel-blue" /> Couverture Identifiants
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={identifierData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#00000005' }} contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Bar dataKey="value" radius={0} barSize={40} stroke="#000" strokeWidth={1}>
                  {identifierData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Employeur (Horizontal) */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[380px] flex flex-col transition-all">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <Users className="w-5 h-5 text-pixel-yellow" /> Employeurs (Top 8)
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employerData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#00000005' }} contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Bar dataKey="value" fill="#fff44f" stroke="#000" strokeWidth={1} radius={0} barSize={15}>
                   <LabelList dataKey="value" position="right" style={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8', fontFamily: 'monospace' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Grade (Horizontal) */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[340px] flex flex-col transition-all">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <BarChart3 className="w-5 h-5 text-pixel-blue" /> Top Grades
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData} layout="vertical" margin={{ left: 5, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#00000005' }} contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Bar dataKey="value" fill={COLORS.primary} stroke="#000" strokeWidth={1} radius={0} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Type d'emploi */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[380px] flex flex-col transition-all">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <BarChart3 className="w-5 h-5 text-pixel-pink" /> Type d'emploi (Top 10)
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractTypeData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#00000005' }} contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Bar dataKey="value" fill="#f20066" stroke="#000" strokeWidth={1} radius={0} barSize={13}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8', fontFamily: 'monospace' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Appartenance (Horizontal) */}
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white shadow-pixel h-[340px] flex flex-col transition-all lg:col-span-2">
          <h3 className="text-xl font-pixel mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <BarChart3 className="w-5 h-5 text-pixel-teal" /> Répartition par Labo (Top 8)
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#00000005' }} contentStyle={{ border: '2px solid black', fontFamily: 'monospace', fontSize: '10px' }} />
                <Bar dataKey="value" fill="#6bedd1" stroke="#000" strokeWidth={1} radius={0} barSize={15}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: '#94a3b8', fontStyle: 'italic', fontFamily: 'monospace' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
