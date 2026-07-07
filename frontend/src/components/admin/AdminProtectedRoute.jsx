import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminGetMe } from '../../api/adminClient';

const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();

  const { isLoading, isError, data } = useQuery({
    queryKey: ['admin-me'],
    queryFn: adminGetMe,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100 dark:bg-slate-950">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Checking admin access...</div>
      </div>
    );
  }

  if (isError || !data?.user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
