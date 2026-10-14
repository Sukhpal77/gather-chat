"use client";
import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';

function Index() {
  const [isRegister, setIsRegister] = useState(false);
  const [position, setPosition] = useState('flex-row');

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setPosition(isRegister ? 'flex-row' : 'flex-row-reverse');
  };

  return (
    <div className="flex bg-gradient-to-b from-purple-500 to-blue-500 h-screen w-full justify-center items-center">
      <div
        className={`flex ${position} opacity-90 bg-white items-center justify-center mx-auto w-[75%] rounded-3xl h-[80%] transform transition-all duration-700 ease-in-out`}
      >
        {/* Left side image section */}
        <div className="w-[50%] h-full bg-gradient-to-b from-purple-300 to-blue-300 rounded-3xl shadow-md shadow-purple-900 flex justify-center items-center pb-32 transition-all duration-700 ease-in-out">
          <img
            src="/img/welcome.png"
            alt="Welcome"
            className="w-full h-full object-cover bg-transparent transition-opacity duration-700"
          />
        </div>
        {/* Right side form section */}
        <div className="flex flex-col w-[50%] justify-center items-center h-full transition-opacity duration-700 ease-in-out">
          {isRegister ? <Register toggleForm={toggleForm} /> : <Login toggleForm={toggleForm} />}
        </div>
      </div>
    </div>
  );
}

export default Index;
