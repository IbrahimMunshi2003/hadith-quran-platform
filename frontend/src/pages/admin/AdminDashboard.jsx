import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminListHadiths } from '../../api/adminClient';

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminListHadiths({ page: 1, limit: 1 })
  });

  const total = data?.total || 0;

  return (
    <AdminLayout title="Dashboard" subtitle="Manage hadith content from a single admin surface.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Hadiths" value={isLoading ? '...' : total.toLocaleString()} />
        <StatCard label="Published" value="Managed via bulk actions" />
        <StatCard label="Verified" value="Managed via bulk actions" />
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 text-white p-6 shadow-lg">
        <h3 className="text-xl font-bold">Hadith Management</h3>
        <p className="text-sm text-emerald-50 mt-1">Search, edit, delete, audit history, and preview live rendering.</p>
        <Link
          to="/admin/hadiths"
          className="inline-block mt-4 rounded-lg bg-white text-emerald-700 font-semibold px-4 py-2"
        >
          Open Hadith CMS
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
