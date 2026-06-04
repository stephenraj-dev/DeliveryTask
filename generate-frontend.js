const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend');
const srcDir = path.join(baseDir, 'src');

const files = {
  // Config files
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}`,
  'postcss.config.js': `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`,
  
  // Base CSS
  'src/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { @apply bg-gray-50 text-gray-900 font-sans; }`,
  
  // API & Socket Services
  'src/services/api.ts': `import axios from 'axios';\n\nexport const api = axios.create({\n  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001'\n});\n\napi.interceptors.request.use((config) => {\n  const token = localStorage.getItem('token');\n  if (token) config.headers.Authorization = \`Bearer \${token}\`;\n  return config;\n});`,
  
  'src/services/socket.ts': `import { io } from 'socket.io-client';\n\nexport const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', { autoConnect: false });`,

  // Redux Store
  'src/store/index.ts': `import { configureStore } from '@reduxjs/toolkit';\nimport authReducer from './authSlice';\n\nexport const store = configureStore({\n  reducer: {\n    auth: authReducer,\n  },\n});\n\nexport type RootState = ReturnType<typeof store.getState>;\nexport type AppDispatch = typeof store.dispatch;`,
  
  'src/store/authSlice.ts': `import { createSlice } from '@reduxjs/toolkit';\n\nconst initialState = {\n  token: localStorage.getItem('token'),\n  user: JSON.parse(localStorage.getItem('user') || 'null'),\n};\n\nconst authSlice = createSlice({\n  name: 'auth',\n  initialState,\n  reducers: {\n    setCredentials: (state, action) => {\n      state.token = action.payload.token;\n      state.user = action.payload.user;\n      localStorage.setItem('token', action.payload.token);\n      localStorage.setItem('user', JSON.stringify(action.payload.user));\n    },\n    logout: (state) => {\n      state.token = null;\n      state.user = null;\n      localStorage.removeItem('token');\n      localStorage.removeItem('user');\n    }\n  }\n});\n\nexport const { setCredentials, logout } = authSlice.actions;\nexport default authSlice.reducer;`,

  // Components
  'src/components/ProtectedRoute.tsx': `import { Navigate, Outlet } from 'react-router-dom';\nimport { useSelector } from 'react-redux';\nimport { RootState } from '../store';\n\nexport const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {\n  const { user, token } = useSelector((state: RootState) => state.auth);\n  if (!token || !user) return <Navigate to="/login" />;\n  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;\n  return <Outlet />;\n};`,

  // Pages
  'src/pages/Login.tsx': `import React, { useState } from 'react';\nimport { useDispatch } from 'react-redux';\nimport { setCredentials } from '../store/authSlice';\nimport { api } from '../services/api';\nimport { useNavigate } from 'react-router-dom';\n\nexport const Login = () => {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  const dispatch = useDispatch();\n  const navigate = useNavigate();\n\n  const handleLogin = async (e: React.FormEvent) => {\n    e.preventDefault();\n    try {\n      const { data } = await api.post('/auth/login', { email, password });\n      dispatch(setCredentials(data));\n      if (data.user.role === 'admin') navigate('/dashboard');\n      else if (data.user.role === 'client') navigate('/orders');\n      else navigate('/my-deliveries');\n    } catch (err) {\n      alert('Login failed');\n    }\n  };\n\n  return (\n    <div className="flex min-h-screen items-center justify-center">\n      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">\n        <h2 className="text-2xl mb-6 font-bold text-center">Login</h2>\n        <input className="w-full border p-2 mb-4 rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />\n        <input className="w-full border p-2 mb-6 rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />\n        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" type="submit">Sign In</button>\n      </form>\n    </div>\n  );\n};`,
  
  'src/pages/AdminDashboard.tsx': `import React, { useEffect, useState } from 'react';\nimport { api } from '../services/api';\n\nexport const AdminDashboard = () => {\n  const [stats, setStats] = useState<any>({});\n\n  useEffect(() => {\n    api.get('/analytics/summary').then(res => setStats(res.data)).catch(console.error);\n  }, []);\n\n  return (\n    <div className="p-8">\n      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>\n      <div className="grid grid-cols-4 gap-4 mb-8">\n        <div className="bg-white p-6 rounded shadow">\n          <h3 className="text-gray-500">Total Orders</h3>\n          <p className="text-2xl font-bold">{stats.totalOrders || 0}</p>\n        </div>\n        <div className="bg-white p-6 rounded shadow">\n          <h3 className="text-gray-500">Delivered</h3>\n          <p className="text-2xl font-bold">{stats.delivered || 0}</p>\n        </div>\n        <div className="bg-white p-6 rounded shadow">\n          <h3 className="text-gray-500">Success Rate</h3>\n          <p className="text-2xl font-bold">{stats.successRate ? \`\${Math.round(stats.successRate)}%\` : '0%'}</p>\n        </div>\n        <div className="bg-white p-6 rounded shadow">\n          <h3 className="text-gray-500">Pending</h3>\n          <p className="text-2xl font-bold">{stats.pending || 0}</p>\n        </div>\n      </div>\n    </div>\n  );\n};`,
  
  'src/pages/ClientOrders.tsx': `import React from 'react';\n\nexport const ClientOrders = () => {\n  return (\n    <div className="p-8">\n      <h1 className="text-3xl font-bold mb-6">My Orders (Client)</h1>\n      <p>Order placement and listing features would go here.</p>\n    </div>\n  );\n};`,
  
  'src/pages/RiderDeliveries.tsx': `import React from 'react';\n\nexport const RiderDeliveries = () => {\n  return (\n    <div className="p-8">\n      <h1 className="text-3xl font-bold mb-6">My Deliveries (Rider)</h1>\n      <p>Delivery tracking and status update features would go here.</p>\n    </div>\n  );\n};`,
  
  'src/App.tsx': `import React from 'react';\nimport { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';\nimport { Provider } from 'react-redux';\nimport { store } from './store';\nimport { Login } from './pages/Login';\nimport { AdminDashboard } from './pages/AdminDashboard';\nimport { ClientOrders } from './pages/ClientOrders';\nimport { RiderDeliveries } from './pages/RiderDeliveries';\nimport { ProtectedRoute } from './components/ProtectedRoute';\n\nfunction App() {\n  return (\n    <Provider store={store}>\n      <Router>\n        <Routes>\n          <Route path="/login" element={<Login />} />\n          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>\n            <Route path="/dashboard" element={<AdminDashboard />} />\n          </Route>\n          <Route element={<ProtectedRoute allowedRoles={['client']} />}>\n            <Route path="/orders" element={<ClientOrders />} />\n          </Route>\n          <Route element={<ProtectedRoute allowedRoles={['rider']} />}>\n            <Route path="/my-deliveries" element={<RiderDeliveries />} />\n          </Route>\n          <Route path="/" element={<Navigate to="/login" />} />\n        </Routes>\n      </Router>\n    </Provider>\n  );\n}\n\nexport default App;`,
  
  'src/main.tsx': `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Frontend files generated successfully.');
