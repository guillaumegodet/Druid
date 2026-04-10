import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Researcher, Structure } from '../types';

/**
 * Service pour l'exportation des données dans différents formats.
 */
export const ExportService = {

  /**
   * Exporte une liste en CSV
   */
  exportToCSV: (data: any[], fileName: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(item => headers.map(header => {
        const val = item[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Exporte une liste en Excel (XLSX)
   */
  exportToExcel: (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  /**
   * Exporte les fiches chercheurs en PDF (Format Table)
   */
  exportResearchersPDF: (researchers: Researcher[]) => {
    const doc = new jsPDF();
    doc.text('Annuaire de la Recherche - Druid', 14, 15);
    
    const tableData = researchers.map(r => [
      r.displayName,
      r.email,
      r.status,
      r.employment.employer,
      r.affiliations[0]?.structureName || ''
    ]);

    autoTable(doc, {
      head: [['Nom', 'Email', 'Statut', 'Employeur', 'Structure']],
      body: tableData,
      startY: 20,
    });

    doc.save('chercheurs_druid.pdf');
  },

  /**
   * Exporte une fiche chercheur individuelle détaillée
   */
  exportSingleResearcherPDF: (researcher: Researcher) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text(researcher.displayName, 14, 20);
    doc.setFontSize(10);
    doc.text(`ID: ${researcher.id} | UID: ${researcher.uid}`, 14, 28);
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // General Info
    doc.setFontSize(14);
    doc.text('Informations Générales', 14, 42);
    
    autoTable(doc, {
      startY: 45,
      body: [
        ['Civilité', researcher.civility],
        ['Nom', researcher.lastName],
        ['Prénom', researcher.firstName],
        ['Email', researcher.email],
        ['Nationalité', researcher.nationality || 'N/A'],
        ['Date de naissance', researcher.birthDate || 'N/A'],
      ],
      theme: 'plain',
      styles: { fontSize: 10 }
    });

    // Employment
    doc.setFontSize(14);
    doc.text('Contrat et Emploi', 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 18,
      body: [
        ['Employeur', researcher.employment.employer],
        ['Type de contrat', researcher.employment.contractType || 'N/A'],
        ['Grade', researcher.employment.grade || 'N/A'],
        ['Typologie', researcher.employment.internalTypology || 'N/A'],
      ],
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    // Affiliations
    doc.setFontSize(14);
    doc.text('Affiliations', 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 18,
      head: [['Structure', 'Équipe', 'Début', 'Principale']],
      body: researcher.affiliations.map(a => [
        a.structureName,
        a.team,
        a.startDate,
        a.isPrimary ? 'OUI' : 'NON'
      ]),
      styles: { fontSize: 10 }
    });

    doc.save(`fiche_${researcher.lastName.toLowerCase()}.pdf`);
  }
};
