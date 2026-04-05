import React from 'react';
import { Navigate } from 'react-router-dom';
import Unauthorized from '../component/UI/unauthorized';

const RouteGuard = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token'); // Check if the user is logged in
  const userRole = localStorage.getItem('role'); // Fetch the user role

  // Redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Unauthorized users
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Unauthorized />;
  }

  // Allows access
  return children;
};

export default RouteGuard;
