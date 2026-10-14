import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import API_URL from '../../../predefineVar';

export default function Register({ toggleForm }) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setErrorMessage('');

        const formData = new FormData();
        for (const key in data) {
            if (key === 'profile') {
                formData.append(key, data[key][0]);
            } else {
                formData.append(key, data[key]);
            }
        }
        try {
            const response = await axios.post(`http://${API_URL}:5000/auth/register`, formData );
            console.log(response.data);

            toggleForm();
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
        <div className="w-full rounded-lg h-full overflow-y-auto no-scrollbar">
            <div className="p-3 space-y-4 md:space-y-6 sm:p-8">
                <div className="flex flex-col items-center justify-center">
                    <img src="/img/logo.png" alt="Logo" className="w-32 h-20 mb-6" />
                    <h1 className="text-xl font-bold leading-tight tracking-tight text-purple-700 md:text-2xl">Sign Up</h1>
                </div>
                <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="userName" className="block mb-2 text-sm font-medium text-purple-700">Username</label>
                        <input
                            type="text"
                            {...register('userName', { required: 'Username is required' })}
                            id="userName"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="Your username"
                        />
                        {errors.userName && <p className="text-red-500 text-sm">{errors.userName.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-purple-700">Email</label>
                        <input
                            type="email"
                            {...register('email', { required: 'Email is required' })}
                            id="email"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="name@company.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-purple-700">Password</label>
                        <input
                            type="password"
                            {...register('password', { required: 'Password is required' })}
                            id="password"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-purple-700">First Name</label>
                        <input
                            type="text"
                            {...register('firstName', { required: 'First Name is required' })}
                            id="firstName"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="First Name"
                        />
                        {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-purple-700">Last Name</label>
                        <input
                            type="text"
                            {...register('lastName', { required: 'Last Name is required' })}
                            id="lastName"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="Last Name"
                        />
                        {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-purple-700">Mobile</label>
                        <input
                            type="tel"
                            {...register('mobile', { required: 'Mobile number is required' })}
                            id="mobile"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="Mobile Number"
                        />
                        {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="address" className="block mb-2 text-sm font-medium text-purple-700">Address</label>
                        <input
                            type="text"
                            {...register('address', { required: 'Address is required' })}
                            id="address"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="Address"
                        />
                        {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="profile" className="block mb-2 text-sm font-medium text-purple-700">Profile</label>
                        <input
                            type="file"
                            {...register('profile')}
                            id="profile"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                        />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block mb-2 text-sm font-medium text-purple-700">Bio</label>
                        <input
                            type="text"
                            {...register('bio', { required: 'bio is required' })}
                            id="bio"
                            className="bg-gray-50 border border-purple-300 text-purple-700 rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5"
                            placeholder="Enter bio (e.g., active, inactive)"
                        />
                        {errors.bio && <p className="text-red-500 text-sm">{errors.bio.message}</p>}
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
                                Signing up...
                            </div>
                        ) : 'Sign up'}
                    </button>
                    <p className="text-sm font-light text-purple-500">
                        Already have an account? <a href="#" onClick={toggleForm} className="font-medium text-purple-600 hover:underline">Sign in</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
