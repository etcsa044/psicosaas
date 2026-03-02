'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { api, setAccessToken } from '@/lib/axios';

/**
 * Temporary smoke test page for auth infrastructure.
 * DELETE after Phase 0 validation.
 */

interface LogEntry {
    time: string;
    type: 'info' | 'success' | 'error' | 'warn';
    message: string;
}

export default function AuthTestPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [email, setEmail] = useState('smoketest@test.com');
    const [password, setPassword] = useState('Test1234!');
    const accessTokenRef = useRef<string | null>(null);

    function log(type: LogEntry['type'], message: string) {
        const time = new Date().toLocaleTimeString('es-AR', { hour12: false });
        setLogs((prev) => [...prev, { time, type, message }]);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // ── TEST 1: Register + Login ──
    async function testRegister() {
        log('info', '=== TEST: Register ===');
        try {
            const res = await axios.post('/api/auth/register', {
                email,
                password,
                profile: { firstName: 'Smoke', lastName: 'Test' },
            });
            log('success', `Register OK — user: ${res.data.user?.email}`);
            log('success', `accessToken received: ${res.data.accessToken ? 'YES (' + res.data.accessToken.substring(0, 20) + '...)' : 'NO'}`);
            accessTokenRef.current = res.data.accessToken;
            setAccessToken(res.data.accessToken);

            // Check cookie
            log('info', 'Checking if refreshToken cookie is accessible via JS...');
            const cookieVisible = document.cookie.includes('refreshToken');
            if (cookieVisible) {
                log('error', '❌ SECURITY FAIL: refreshToken visible in document.cookie!');
            } else {
                log('success', '✅ refreshToken NOT visible in document.cookie (HttpOnly works)');
            }

            // Check localStorage
            log('info', 'Checking localStorage for tokens...');
            const lsToken = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
            if (lsToken) {
                log('error', '❌ SECURITY FAIL: Token found in localStorage!');
            } else {
                log('success', '✅ No tokens in localStorage');
            }

            // Check window
            if ((window as any).accessToken || (window as any).refreshToken) {
                log('error', '❌ SECURITY FAIL: Token exposed on window object!');
            } else {
                log('success', '✅ No tokens on window object');
            }
        } catch (err: any) {
            if (err.response?.status === 409) {
                log('warn', 'User already exists, try Login instead');
            } else {
                log('error', `Register failed: ${err.response?.data?.message || err.message}`);
            }
        }
    }

    async function testLogin() {
        log('info', '=== TEST: Login ===');
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            log('success', `Login OK — user: ${res.data.user?.email}`);
            log('success', `accessToken: ${res.data.accessToken ? 'YES (' + res.data.accessToken.substring(0, 20) + '...)' : 'NO'}`);
            accessTokenRef.current = res.data.accessToken;
            setAccessToken(res.data.accessToken);

            // Verify HttpOnly cookie
            const cookieVisible = document.cookie.includes('refreshToken');
            if (cookieVisible) {
                log('error', '❌ SECURITY: refreshToken visible in document.cookie!');
            } else {
                log('success', '✅ refreshToken is HttpOnly (not visible to JS)');
            }

            // Decode JWT to show payload (no verification, just reading)
            try {
                const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
                log('info', `JWT payload: _id=${payload._id}, tenantId=${payload.tenantId}, roleId=${payload.roleId}`);
                const exp = new Date(payload.exp * 1000);
                log('info', `Token expires at: ${exp.toLocaleString('es-AR')}`);
            } catch {
                log('warn', 'Could not decode JWT payload');
            }
        } catch (err: any) {
            log('error', `Login failed: ${err.response?.data?.message || err.message}`);
        }
    }

    // ── TEST 2: Silent Refresh ──
    async function testSilentRefresh() {
        log('info', '=== TEST: Silent Refresh ===');
        try {
            log('info', 'Clearing access token from memory...');
            accessTokenRef.current = null;
            setAccessToken(null);
            log('info', 'Calling /api/auth/refresh (cookie should go automatically)...');

            const res = await axios.post(
                '/api/auth/refresh',
                {},
                { headers: { 'x-csrf-protection': '1' } }
            );
            log('success', `Refresh OK — new accessToken: ${res.data.accessToken ? 'YES' : 'NO'}`);
            accessTokenRef.current = res.data.accessToken;
            setAccessToken(res.data.accessToken);

            // Decode new JWT
            try {
                const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
                const exp = new Date(payload.exp * 1000);
                log('success', `New token expires at: ${exp.toLocaleString('es-AR')}`);
            } catch {
                log('warn', 'Could not decode new JWT');
            }
        } catch (err: any) {
            log('error', `Refresh failed: ${err.response?.status} — ${err.response?.data?.message || err.message}`);
        }
    }

    // ── TEST 3: Protected Request with Token ──
    async function testProtectedRequest() {
        log('info', '=== TEST: Protected Request ===');
        if (!accessTokenRef.current) {
            log('warn', 'No access token — login first');
            return;
        }
        try {
            log('info', 'Calling GET /api/patients with Bearer token via api interceptor...');
            const res = await api.get(`/patients`);
            log('success', `Protected request OK — status: ${res.status}`);
            log('info', `Response data keys: ${JSON.stringify(Object.keys(res.data))}`);
        } catch (err: any) {
            log('error', `Protected request failed: ${err.response?.status} — ${err.response?.data?.message || err.message}`);
        }
    }

    // ── TEST 4: Logout ──
    async function testLogout() {
        log('info', '=== TEST: Logout ===');
        try {
            const res = await axios.post(
                '/api/auth/logout',
                {},
                { headers: { 'x-csrf-protection': '1' } }
            );
            log('success', `Logout response: ${JSON.stringify(res.data)}`);
            accessTokenRef.current = null;
            setAccessToken(null);

            // Verify cookie was cleared
            log('info', 'Attempting refresh after logout (should fail)...');
            try {
                await axios.post(
                    '/api/auth/refresh',
                    {},
                    { headers: { 'x-csrf-protection': '1' } }
                );
                log('error', '❌ Refresh succeeded after logout — token not properly revoked!');
            } catch (refreshErr: any) {
                log('success', `✅ Refresh correctly failed after logout: ${refreshErr.response?.status}`);
            }
        } catch (err: any) {
            log('error', `Logout failed: ${err.message}`);
        }
    }

    // ── TEST 5: CSP Headers ──
    async function testSecurityHeaders() {
        log('info', '=== TEST: Security Headers ===');
        try {
            const res = await fetch(window.location.href);
            const headers = {
                'x-frame-options': res.headers.get('x-frame-options'),
                'x-content-type-options': res.headers.get('x-content-type-options'),
                'referrer-policy': res.headers.get('referrer-policy'),
            };

            for (const [key, value] of Object.entries(headers)) {
                if (value) {
                    log('success', `✅ ${key}: ${value}`);
                } else {
                    log('warn', `⚠️ ${key}: not set`);
                }
            }
        } catch (err: any) {
            log('error', `Header check failed: ${err.message}`);
        }
    }

    function clearLogs() {
        setLogs([]);
    }

    const typeColors = {
        info: 'text-blue-400',
        success: 'text-green-400',
        error: 'text-red-400',
        warn: 'text-yellow-400',
    };

    return (
        <div className="min-h-screen bg-gray-950 p-8 text-white font-mono">
            <h1 className="text-2xl font-bold mb-2">🧪 Auth Infrastructure Smoke Test</h1>
            <p className="text-gray-400 mb-6 text-sm">Temporary page — DELETE after Phase 0 validation</p>

            <div className="flex gap-4 mb-6">
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="bg-gray-800 px-3 py-2 rounded text-sm border border-gray-700"
                />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                    className="bg-gray-800 px-3 py-2 rounded text-sm border border-gray-700"
                />
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
                <button onClick={testRegister} className="bg-indigo-600 px-4 py-2 rounded text-sm hover:bg-indigo-700">
                    1. Register
                </button>
                <button onClick={testLogin} className="bg-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-700">
                    2. Login
                </button>
                <button onClick={testSilentRefresh} className="bg-cyan-600 px-4 py-2 rounded text-sm hover:bg-cyan-700">
                    3. Silent Refresh
                </button>
                <button onClick={testProtectedRequest} className="bg-emerald-600 px-4 py-2 rounded text-sm hover:bg-emerald-700">
                    4. Protected Request
                </button>
                <button onClick={testLogout} className="bg-orange-600 px-4 py-2 rounded text-sm hover:bg-orange-700">
                    5. Logout
                </button>
                <button onClick={testSecurityHeaders} className="bg-purple-600 px-4 py-2 rounded text-sm hover:bg-purple-700">
                    6. Security Headers
                </button>
                <button onClick={clearLogs} className="bg-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-600">
                    Clear Logs
                </button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 max-h-[60vh] overflow-y-auto border border-gray-800">
                <h2 className="text-sm text-gray-500 mb-3">Console Output</h2>
                {logs.length === 0 && (
                    <p className="text-gray-600 text-sm">Click a test button to begin...</p>
                )}
                {logs.map((entry, i) => (
                    <div key={i} className={`text-sm ${typeColors[entry.type]} py-0.5`}>
                        <span className="text-gray-600">[{entry.time}]</span> {entry.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
