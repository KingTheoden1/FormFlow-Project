// lib/socket.ts — lazy Socket.io client singleton.
//
// Why lazy?
// The same reason as getStripe() and getPool() — we don't want to open a
// WebSocket connection the moment the app loads.  We connect only when a
// component actually calls getSocket(), so pages that don't need real-time
// updates (e.g. the login page) never touch the socket.
//
// Why a singleton?
// Socket.io creates a persistent TCP connection.  Creating a new instance
// every time a component mounts would open a new connection each time,
// which is wasteful and causes duplicate event listeners.
//
// autoConnect: false
// We turn off automatic connection so the useSocket hook controls exactly
// when to connect and disconnect — giving us clean cleanup on unmount.
//
// VITE_SOCKET_URL
// In development this is empty ('') which makes Socket.io connect to the
// same origin as the page (http://localhost:5173 → proxied to :3001 via
// the Vite dev server proxy).
// In production set VITE_SOCKET_URL to your backend URL.

import { io, type Socket } from 'socket.io-client'

let _socket: Socket | null = null

export function getSocket(): Socket {
  if (_socket) return _socket

  const url = import.meta.env.VITE_SOCKET_URL ?? ''

  _socket = io(url, {
    // Don't connect until socket.connect() is called explicitly
    autoConnect: false,
    // Send the HttpOnly cookie with upgrade requests so the server can
    // identify the user if needed in the future
    withCredentials: true,
  })

  return _socket
}
