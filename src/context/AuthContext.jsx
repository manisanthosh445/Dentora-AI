import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('chaitanya_erp_user');
    return cached ? JSON.parse(cached) : null;
  });

  const login = (emailOrPhone, credentials) => {
    let role = 'Patient';
    let name = 'Valued Patient';
    let email = '';
    let phone = '';

    const cleanInput = emailOrPhone.trim().toLowerCase();

    if (cleanInput.includes('@')) {
      email = cleanInput;
      if (cleanInput === 'chief@chaitanya.com' || cleanInput === 'manisanthosh445@gmail.com') {
        role = 'Chief Doctor';
        name = 'Dr. Manisanthosh';
      } else if (cleanInput === 'doctor@chaitanya.com') {
        role = 'Doctor';
        name = 'Dr. Anusha';
      } else if (cleanInput === 'reception@chaitanya.com') {
        role = 'Receptionist';
        name = 'Brundhan (Reception)';
      } else {
        // Fallback for custom doctor/reception emails
        if (cleanInput.includes('doctor') || cleanInput.includes('dentist')) {
          role = 'Doctor';
          name = 'Dr. Practitioner';
        } else if (cleanInput.includes('reception') || cleanInput.includes('admin')) {
          role = 'Receptionist';
          name = 'Desk Administrator';
        } else {
          role = 'Chief Doctor';
          name = 'Dr. Chief Staff';
        }
      }
    } else {
      // It's a mobile login (Patient)
      phone = cleanInput;
      role = 'Patient';
      name = 'Rahul Sharma'; // Seed patient name
    }

    const userProfile = { name, role, email, phone };
    setUser(userProfile);
    localStorage.setItem('chaitanya_erp_user', JSON.stringify(userProfile));
    return userProfile;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chaitanya_erp_user');
  };

  const isChief = () => user?.role === 'Chief Doctor';
  const isDoctor = () => user?.role === 'Doctor';
  const isReceptionist = () => user?.role === 'Receptionist';
  const isPatient = () => user?.role === 'Patient';

  return (
    <AuthContext.Provider value={{ user, login, logout, isChief, isDoctor, isReceptionist, isPatient }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
