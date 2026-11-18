
import React from 'react';
import { Outlet } from 'react-router-dom';

const PatientLayout: React.FC = () => {
    return (
        <div className="h-screen w-full relative z-10 overflow-hidden bg-black text-white">
            <Outlet />
        </div>
    );
};

export default PatientLayout;
