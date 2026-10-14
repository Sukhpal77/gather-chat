"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import API_URL from '../../../predefineVar';

export default function Login({ toggleForm }) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const validateForm = () => {
    if (!userName || !password) {
      setErrorMessage('Email and password are required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`http://${API_URL}:5000/auth/login`, { userName, password });
      console.log(response.data);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo));

      router.push('/Home');
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <img src="/img/logo.png" alt="Logo" className="w-32 h-20" />
      <div className="w-full rounded-lg">
        <div className="p-3 space-y-4 md:space-y-6 sm:p-8">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-purple-700 md:text-2xl">Sign in</h1>
          </div>
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userName" className="block mb-2 text-sm font-medium text-purple-700">Your userName</label>
              <input
                type="text"
                name="userName"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                placeholder="UserName"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-purple-700">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                required
              />
            </div>
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="remember"
                    aria-describedby="remember"
                    type="checkbox"
                    className="w-4 h-4 border border-purple-300 rounded bg-purple-50 focus:ring-3 focus:ring-purple-300 ring-offset-purple-400"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="remember" className="text-purple-500">Remember me</label>
                </div>
              </div>
              <a href="#" className="text-sm font-medium text-purple-600 hover:underline">Forgot password?</a>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 15.293-4.707l-1.414 1.414A6 6 0 0 0 6 12h-2z" />
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign in'}
            </button>
            <p className="text-sm font-light text-purple-500">
              Don’t have an account yet? <a href="#" onClick={toggleForm} className="font-medium text-purple-600 hover:underline">Sign up</a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
