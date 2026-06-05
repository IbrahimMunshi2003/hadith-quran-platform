import React from 'react';

const GradeBadge = ({ grade, slug }) => {
  if (!grade) return null;
  
  let badgeClass = 'grade-badge-other';
  const cleanSlug = (slug || '').toLowerCase();

  if (cleanSlug.includes('sahih') || grade.includes('ஸஹீஹ்')) {
    badgeClass = 'grade-badge-sahih';
  } else if (cleanSlug.includes('hasan') || grade.includes('ஹஸன்')) {
    badgeClass = 'grade-badge-hasan';
  } else if (cleanSlug.includes('layeef') || cleanSlug.includes('daeef') || grade.includes('ளயீஃப்')) {
    badgeClass = 'grade-badge-layeef';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border uppercase ${badgeClass}`}>
      {grade}
    </span>
  );
};

export default GradeBadge;
