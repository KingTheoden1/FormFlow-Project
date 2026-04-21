import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// Use these everywhere instead of plain useDispatch / useSelector.
// They carry the correct types so you never need to annotate at call sites.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
