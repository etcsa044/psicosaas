import React from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    {/* Placeholder for Logo */}
                    <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        P
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    PsicoSaaS
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
}
