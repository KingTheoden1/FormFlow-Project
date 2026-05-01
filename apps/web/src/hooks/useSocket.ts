// hooks/useSocket.ts — connects to Socket.io and watches a form for live submissions.
//
// How it works:
//   1. On mount, the hook calls getSocket() to get (or create) the singleton.
//   2. It connects and emits 'watch_form' with the formId.
//      The server then adds this socket to the room named `form:${formId}`.
//   3. When any user submits the form, the server emits 'new_submission' to
//      that room.  We receive it and re-fetch the full submissions list.
//   4. On unmount, we emit 'unwatch_form', remove all listeners, and disconnect.
//      This prevents memory leaks and duplicate listeners.
//
// Why re-fetch instead of appending the socket payload?
// The 'new_submission' event only carries { id, formId, submittedAt } — not
// the full field data.  Re-fetching ensures the table always shows complete,
// accurate data without a second request per field.
//
// Connection status is stored in Redux so the UI can show a live/offline badge.

import { useEffect } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { getSocket } from '@/lib/socket'
import {
  fetchSubmissionsAsync,
  setConnectionStatus,
} from '@/features/responses/responsesSlice'

export function useSocket(formId: string): void {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const socket = getSocket()

    // ── Connect ──────────────────────────────────────────────────
    dispatch(setConnectionStatus('connecting'))
    socket.connect()

    // Fired when the WebSocket handshake succeeds
    socket.on('connect', () => {
      dispatch(setConnectionStatus('connected'))
      // Join the server-side room for this form
      socket.emit('watch_form', formId)
    })

    // Fired when the connection drops (network issue, server restart, etc.)
    socket.on('disconnect', () => {
      dispatch(setConnectionStatus('disconnected'))
    })

    // Fired by the server every time a new submission is saved
    socket.on('new_submission', () => {
      // Re-fetch the full list — this gives us all field data, not just the
      // summary the socket carries
      void dispatch(fetchSubmissionsAsync(formId))
    })

    // ── Cleanup ───────────────────────────────────────────────────
    // React runs this when the component using this hook unmounts, or when
    // formId changes.  We leave the room and close the connection so we
    // don't receive events we're no longer interested in.
    return () => {
      socket.emit('unwatch_form', formId)
      socket.off('connect')
      socket.off('disconnect')
      socket.off('new_submission')
      socket.disconnect()
      dispatch(setConnectionStatus('disconnected'))
    }
  }, [formId, dispatch])
}
